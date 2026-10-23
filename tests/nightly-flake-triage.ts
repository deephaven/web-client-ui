#!/usr/bin/env node
/* eslint-disable no-console, no-param-reassign, no-control-regex */
/**
 * Playwright nightly-run triage.
 *
 * History is a small rolling-window blob restored/saved by actions/cache, so
 * this needs no push access/orphan branch/etc. A cold cache is not fatal:
 * flakeRate/priorFixAttempts simply start empty and rebuild over a few nights.
 *
 * Usage:
 *   node nightly-flake-triage.ts --report ./report.json \
 *     --history ./.test-health/history.json \
 *     --out ./.test-health/decisions.json [--dry-run]
 *
 * Env: GITHUB_TOKEN (issues: write), GITHUB_REPOSITORY, GITHUB_RUN_ID,
 *      GITHUB_SERVER_URL, GITHUB_SHA, GITHUB_REF_NAME, GITHUB_STEP_SUMMARY.
 * Without GITHUB_TOKEN the script runs in dry-run mode and only writes files.
 *
 * Optional: COPILOT_ASSIGN_TOKEN enables assigning the top fingerprints to the
 * Copilot cloud agent. It must be a user-to-server token (PAT or GitHub App
 * user token) -- the Actions GITHUB_TOKEN is rejected by the assignment API.
 * Unset, the script still opens and labels issues, just without an assignee.
 *
 * Schema note: reads Playwright's JSON reporter shape (suites -> specs ->
 * tests -> results, with a resolved `status` of 'expected' | 'unexpected' |
 * 'flaky' | 'skipped').
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  appendFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

// ---------- types ----------

type TestStatus = 'expected' | 'unexpected' | 'flaky' | 'skipped';
type FailingStatus = 'flaky' | 'unexpected';
// 'instrumented' marks an attempt that deliberately only added diagnostics, so the failure
// coming back is the expected outcome and must not spend one of the tries before escalation.
type FixOutcome = 'recurred' | 'held' | 'instrumented';
type Classification =
  | 'chronic_flake'
  | 'new_flake'
  | 'persistent_failure'
  | 'new_hard_failure';
type Route = 'no_action' | 'escalate' | 'auto_fix_candidate';

// Identifies which CI run produced a history record or issue comment.
interface RunContext {
  runId: string;
  runUrl: string;
  reportUrl: string;
  commit: string;
  branch: string;
  timestamp: string;
  // Deephaven server image the suite ran against; `edge` moves nightly, so a flake that
  // starts without a matching frontend commit is often a server change.
  serverVersion: string;
}

// One test's outcome for a single run, appended to its rolling history window.
interface RunRecord extends RunContext {
  status: TestStatus;
  durationMs: number;
}

// Rolling window of recent run outcomes for one test key.
interface TestHistoryEntry {
  runs: RunRecord[];
}

// History signals for one fingerprint, all derived in a single pass over its tests.
interface GroupStats {
  flakeRate: number;
  historyWindow: number;
  hardFailureStreak: number;
  wasFlaky: boolean;
}

// Whether closing a fingerprint's issue actually fixed it or the failure came back.
interface FixAttempt {
  outcome: FixOutcome;
  issueNumber: number;
  runId: string;
  at: string;
}

// Persisted, cross-run state tracked for one fingerprint.
interface FingerprintState {
  fixAttempts: FixAttempt[];
  cleanRunsSinceClose: number;
  testKeys?: string[];
  issueNumber?: number;
  issueState?: 'open' | 'closed';
  lastSeenAt?: string;
  lastSeenRunId?: string;
  openedAt?: string;
}

// Root shape of the history.json cache restored/saved via actions/cache.
interface HistoryStore {
  tests: Record<string, TestHistoryEntry>;
  fingerprints: Record<string, FingerprintState>;
}

// ANSI-stripped error message/stack captured for a failing test.
interface ErrorInfo {
  message: string;
  stack: string;
}

// Minimal identity of one test contributing to a fingerprint's bundle.
interface TestRef {
  file: string;
  title: string;
  project: string;
  status: FailingStatus;
}

// Aggregated view of one fingerprint's failures, used to render its issue body.
interface Bundle {
  fingerprint: string;
  status: FailingStatus;
  classification: Classification;
  tests: TestRef[];
  error: ErrorInfo;
  pageSnapshot: string;
  flakeRate: number;
  historyWindow: number;
  priorFixAttempts: number;
  diagnosticsAttempts: number;
  priorPullRequests: string[];
  traceAttachments: string[];
}

// The routing outcome computed for one fingerprint, plus what was done about it.
interface Decision {
  route: Route;
  reason: string;
  bundle: Bundle;
  rendered?: { title: string; labels: string[]; body: string };
  issue?: number | null;
  issueError?: string;
  assigned?: boolean;
  assignError?: string;
}

// One flaky/failed test occurrence extracted from the Playwright report while walking it.
interface FailingTest {
  testKey: string;
  file: string;
  title: string;
  project: string;
  status: FailingStatus;
  fp: string;
  error: ErrorInfo;
  pageSnapshot: string;
  attachments: string[];
}

// Minimal shape of Playwright's merged JSON reporter output -- only the
// fields this script reads, not the full public schema.
// Structured form of `error.errorContext` when Playwright supplies an object instead of a string.
interface PlaywrightErrorContext {
  value?: string;
  text?: string;
  body?: string;
}

// Failure details for a single test-result attempt.
interface PlaywrightError {
  message?: string;
  stack?: string;
  errorContext?: string | PlaywrightErrorContext;
}

// A file or inline blob attached to a result (traces, screenshots, error context snapshots).
interface PlaywrightAttachment {
  name?: string;
  path?: string;
  body?: string;
}

// One attempt (initial run or retry) of a test.
interface PlaywrightResult {
  duration?: number;
  error?: PlaywrightError;
  attachments?: PlaywrightAttachment[];
}

// A test as executed under one Playwright project (e.g. one browser).
interface PlaywrightTest {
  status: TestStatus;
  projectName?: string;
  results?: PlaywrightResult[];
}

// One `test()` definition and its per-project results.
interface PlaywrightSpec {
  file: string;
  title: string;
  tests?: PlaywrightTest[];
}

// A describe block or file grouping, recursively containing specs and child suites.
interface PlaywrightSuite {
  title?: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

// Fields read back from the GitHub REST API for an issue.
interface GithubIssue {
  number: number;
  state: 'open' | 'closed';
  body?: string;
  labels?: { name?: string }[];
  // Present only when the item is really a pull request; the issues endpoint returns both.
  pull_request?: unknown;
}

// Minimal shape of the cross-referenced entries in an issue's timeline.
interface TimelineEvent {
  event?: string;
  source?: {
    issue?: {
      html_url?: string;
      body?: string | null;
      pull_request?: { merged_at?: string | null };
    };
  };
}

// A pull request that referenced an issue, with what triage needs to judge that round.
interface LinkedPullRequest {
  url: string;
  body: string;
  mergedAt: string | null;
}

// Thin wrapper over the subset of the GitHub REST API this script needs.
interface GithubClient {
  getIssue: (number: number) => Promise<GithubIssue>;
  updateIssue: (
    number: number,
    patch: Record<string, unknown>
  ) => Promise<GithubIssue | null>;
  comment: (number: number, body: string) => Promise<unknown>;
  createIssue: (payload: Record<string, unknown>) => Promise<GithubIssue>;
  fetchIssuesWithLabel: (label: string) => Promise<GithubIssue[]>;
  fetchLinkedPullRequests: (number: number) => Promise<LinkedPullRequest[]>;
  // null when no user token is configured, since agent assignment requires one.
  assignAgent: ((number: number) => Promise<unknown>) | null;
}

// Parsed --flag values from argv; the index signature allows arbitrary passthrough flags.
interface CliArgs {
  dryRun: boolean;
  report?: string;
  history?: string;
  out?: string;
  [flag: string]: string | boolean | undefined;
}

// ---------- config ----------

const HISTORY_WINDOW = Number(process.env.HISTORY_WINDOW ?? 20);
const ESCALATE_AFTER_ATTEMPTS = Number(
  process.env.ESCALATE_AFTER_ATTEMPTS ?? 2
);
// Ratio of failed tests in a single night that signals a wider failure problem.
const BROAD_FAILURE_RATIO = Number(process.env.BROAD_FAILURE_RATIO ?? 0.3);
const CHRONIC_FLAKE_RATE = Number(process.env.CHRONIC_FLAKE_RATE ?? 0.3);
const PERSISTENT_FAILURE_RATE = Number(
  process.env.PERSISTENT_FAILURE_RATE ?? 0.9
);
// Minimum number of runs required to establish a trend as persistent/chronic.
const MIN_RUNS_FOR_TREND = Number(process.env.MIN_RUNS_FOR_TREND ?? 5);
// Consecutive outright-failure nights a historically flaky test needs before it's treated as a
// hard failure instead of just another flake; a test with no flaky history skips this grace period.
const HARD_FAILURE_STREAK_THRESHOLD = Number(
  process.env.HARD_FAILURE_STREAK_THRESHOLD ?? 2
);
const HOLD_CONFIRM_RUNS = Number(process.env.HOLD_CONFIRM_RUNS ?? 5);
const PRUNE_AFTER_DAYS = Number(process.env.PRUNE_AFTER_DAYS ?? 60);
const MAX_ISSUE_STATE_REFRESHES = 50; // bound the API calls spent re-checking tracked issues

// Assigning Copilot requires a user-to-server token; the Actions-provided GITHUB_TOKEN is a
// server-to-server token and is rejected by the assignment API, so this is a separate secret.
// Leave it unset to keep the pipeline label-only.
const COPILOT_ASSIGN_TOKEN = process.env.COPILOT_ASSIGN_TOKEN ?? '';
const COPILOT_ASSIGNEE = 'copilot-swe-agent[bot]';
const COPILOT_CUSTOM_AGENT =
  process.env.COPILOT_CUSTOM_AGENT ?? 'playwright-flake-investigator';
const COPILOT_BASE_BRANCH = process.env.COPILOT_BASE_BRANCH ?? 'main';
const COPILOT_MODEL = process.env.COPILOT_MODEL ?? 'claude-sonnet-5.5';
// Cap how many fingerprints get handed to an agent per run so one bad night can't open a
// dozen concurrent sessions and PRs. Adjust as needed.
const MAX_AGENT_ASSIGNMENTS_PER_RUN = Number(
  process.env.MAX_AGENT_ASSIGNMENTS_PER_RUN ?? 8
);

// Failures under these paths always go to a human, never to an agent.
const SENSITIVE_PATH_PATTERNS = (process.env.SENSITIVE_PATH_PATTERNS ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => new RegExp(s, 'i'));

const BASE_LABEL = 'e2e-failure';
const AGENT_LABEL = 'auto-investigate';
const HUMAN_LABEL = 'needs-human';
// Agents can't edit labels, so their PRs declare a diagnostics-only round in the description and
// triage reads it from there. The label stays as a manual override for people, and is dropped by
// the next labelsFor() update so each round is counted exactly once.
const DIAGNOSTICS_LABEL = 'diagnostics-added';
const DIAGNOSTICS_ROUND_PATTERN =
  /^\s*Round type:\s*`?diagnostics-only`?\s*$/im;
const CLASSIFICATION_LABELS: Record<Classification, string> = {
  chronic_flake: 'chronic-flake',
  new_flake: 'new-flake',
  persistent_failure: 'persistent-failure',
  new_hard_failure: 'new-hard-failure',
};

const MARKER = (fp: string): string =>
  `<!-- test-health-fingerprint: ${fp} -->`;

// ---------- fingerprinting ----------

// Matches any CSI escape sequence (colors, cursor movement, etc.), not just `m` (SGR/color).
// Playwright's expect() output is colorized with these; left in place they get embedded raw
// in the issue body and render as mangled glyphs (e.g. `<0x1b>[31m` -> `<20>[31m`) once GitHub
// re-encodes the markdown, so this must be stripped from anything we actually display, not
// just from the copy we hash for fingerprinting.
const ANSI_PATTERN = /\u001b\[[0-9;]*[a-zA-Z]/g;

function stripAnsi(text = ''): string {
  return text.replace(ANSI_PATTERN, '');
}

// Strip anything that varies run-to-run (ids, line numbers, timestamps) so
// the same underlying bug hashes to the same fingerprint every time.
function normalizeError(message = '', stackTop = ''): string {
  return stripAnsi(`${message}\n${stackTop}`)
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '<uuid>'
    )
    .replace(/:\d+:\d+/g, ':<line>:<col>')
    .replace(/\b\d{10,13}\b/g, '<timestamp>')
    .replace(/\b\d+(\.\d+)?m?s\b/g, '<duration>')
    .replace(/\b\d+\b/g, '<n>') // numbers
    .replace(/\s+/g, ' ')
    .trim();
}

// first application/test-related frame in the stack trace
function firstAppFrame(stack = ''): string {
  const line = stack
    .split('\n')
    .find(l => l.includes('/tests/') || l.includes('/src/'));
  return line !== undefined ? line.trim() : '';
}

// Hashes the normalized message + first app frame into a short, stable id for this failure.
function fingerprint(error: PlaywrightError): string {
  const signature = normalizeError(error?.message, firstAppFrame(error?.stack));
  return createHash('sha256').update(signature).digest('hex').slice(0, 12);
}

// Playwright exposes the page's accessibility snapshot at failure time either on the
// error itself (1.60+ errorContext) or as an attached markdown file. Try both.
function readAttachmentContext(a: PlaywrightAttachment): string | undefined {
  if (!/error.?context/i.test(a.name ?? '')) return undefined;
  if (typeof a.body === 'string') {
    try {
      return Buffer.from(a.body, 'base64').toString('utf8');
    } catch {
      /* not base64-encoded */
    }
  }
  if (a.path !== undefined && existsSync(a.path)) {
    try {
      return readFileSync(a.path, 'utf8');
    } catch {
      /* unreadable from this runner */
    }
  }
  return undefined;
}

function extractErrorContext(
  error: PlaywrightError | undefined,
  attachments: PlaywrightAttachment[] | undefined
): string {
  const direct = error?.errorContext;
  if (typeof direct === 'string' && direct.trim().length > 0) {
    return direct;
  }
  if (direct !== undefined && typeof direct === 'object') {
    const value = direct.value ?? direct.text ?? direct.body;
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  const fromAttachment = (attachments ?? [])
    .map(readAttachmentContext)
    .find(Boolean);
  return fromAttachment ?? '';
}

// ---------- history store ----------

// Fresh history store, used when there's no cache to restore from (a cold cache).
function emptyHistory(): HistoryStore {
  return { tests: {}, fingerprints: {} };
}

// Reads history.json from disk, falling back to an empty store on a cold cache or bad JSON.
function loadHistory(historyPath: string): HistoryStore {
  if (!existsSync(historyPath)) {
    console.log(
      `No history at ${historyPath} (cold cache) - starting a new store.`
    );
    return emptyHistory();
  }
  try {
    const raw: Partial<HistoryStore> = JSON.parse(
      readFileSync(historyPath, 'utf8')
    );
    return {
      tests: raw.tests ?? {},
      fingerprints: raw.fingerprints ?? {},
    };
  } catch (err) {
    console.warn(
      `History at ${historyPath} is unreadable (${
        (err as Error).message
      }) - starting fresh.`
    );
    return emptyHistory();
  }
}

function saveHistory(historyPath: string, history: HistoryStore): void {
  mkdirSync(path.dirname(historyPath), { recursive: true });
  writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

// Appends this run's outcome to a test's history, trimming to the rolling window.
function recordRun(
  history: HistoryStore,
  testKey: string,
  record: RunRecord
): TestHistoryEntry {
  const entry = history.tests[testKey] ?? { runs: [] };
  entry.runs.push(record);
  entry.runs = entry.runs.slice(-HISTORY_WINDOW);
  history.tests[testKey] = entry;
  return entry;
}

// Gets or lazily creates the persisted state for a fingerprint.
function fingerprintState(history: HistoryStore, fp: string): FingerprintState {
  history.fingerprints[fp] ??= { fixAttempts: [], cleanRunsSinceClose: 0 };
  return history.fingerprints[fp];
}

function attemptsWithOutcome(
  state: FingerprintState | undefined,
  outcome: FixOutcome
): FixAttempt[] {
  return (state?.fixAttempts ?? []).filter(a => a.outcome === outcome);
}

// Aggregate across every test sharing a fingerprint -- one root cause can span
// several specs and several browser projects.
function groupStats(history: HistoryStore, testKeys: string[]): GroupStats {
  let runs = 0;
  let bad = 0;
  let window = 0;
  let hardFailureStreak = 0;
  let wasFlaky = false;

  testKeys
    .map(key => history.tests[key])
    .filter((entry): entry is TestHistoryEntry => Boolean(entry))
    .forEach(entry => {
      runs += entry.runs.length;
      window = Math.max(window, entry.runs.length);

      // Walk backwards so the trailing 'unexpected' streak ends at the first run that broke
      // it; tonight's run is already appended by recordRun() before this is called.
      let trailing = 0;
      let streakIntact = true;
      for (let i = entry.runs.length - 1; i >= 0; i -= 1) {
        const { status } = entry.runs[i];
        if (status !== 'expected') bad += 1;
        if (status === 'flaky') wasFlaky = true;
        if (streakIntact && status === 'unexpected') {
          trailing += 1;
        } else {
          streakIntact = false;
        }
      }
      hardFailureStreak = Math.max(hardFailureStreak, trailing);
    });

  return {
    flakeRate: runs ? bad / runs : 0,
    historyWindow: window,
    hardFailureStreak,
    wasFlaky,
  };
}

// ---------- classification + decision gate ----------

// Labels a fingerprint as new/chronic flake or new/persistent hard failure based on its history.
function classify(
  status: FailingStatus,
  flakeRate: number,
  historyWindow: number,
  streak: number,
  wasFlaky: boolean
): Classification {
  const settled = historyWindow >= MIN_RUNS_FOR_TREND;

  // A historically flaky test gets the benefit of the doubt: an outright failure only counts as
  // a hard failure once it happens HARD_FAILURE_STREAK_THRESHOLD nights in a row. A test with no
  // flaky history has nothing to give it the benefit of the doubt, so it escalates immediately.
  const effectiveStatus: FailingStatus =
    status === 'unexpected' &&
    wasFlaky &&
    streak < HARD_FAILURE_STREAK_THRESHOLD
      ? 'flaky'
      : status;
  if (effectiveStatus === 'unexpected') {
    return settled && flakeRate >= PERSISTENT_FAILURE_RATE
      ? 'persistent_failure'
      : 'new_hard_failure';
  }
  return settled && flakeRate >= CHRONIC_FLAKE_RATE
    ? 'chronic_flake'
    : 'new_flake';
}

// True if any failing test's file matches a configured sensitive-path pattern.
function isSensitivePath(testFiles: string[]): boolean {
  return testFiles.some(f => SENSITIVE_PATH_PATTERNS.some(re => re.test(f)));
}

// Routing gate: infra-wide noise -> sensitive path -> repeat failed fixes -> hand to an agent.
function decide({
  testFiles,
  classification,
  state,
  broadFailureRatio,
}: {
  testFiles: string[];
  classification: Classification;
  state: FingerprintState;
  broadFailureRatio: number;
}): { route: Route; reason: string } {
  if (broadFailureRatio > BROAD_FAILURE_RATIO) {
    return { route: 'no_action', reason: 'broad_failure_likely_infra' };
  }
  if (isSensitivePath(testFiles)) {
    return { route: 'escalate', reason: 'sensitive_path' };
  }
  if (
    attemptsWithOutcome(state, 'recurred').length >= ESCALATE_AFTER_ATTEMPTS
  ) {
    return { route: 'escalate', reason: 'repeat_fix_attempts_failed' };
  }
  return { route: 'auto_fix_candidate', reason: classification };
}

// ---------- issue body ----------

const CLASSIFICATION_MESSAGES: Record<Classification, string> = {
  chronic_flake:
    'This fingerprint has been failing intermittently for a while, so treat it as a genuine flake: ' +
    'find the race, the brittle selector, or the shared-state collision. Do not paper over it with waits or retries.',
  new_flake:
    'This fingerprint has not been seen much in recent history. It may be a brand-new flake or the first sign of a ' +
    'regression - check what changed recently before assuming the test is at fault.',
  persistent_failure:
    'This has failed on effectively every attempt across the recorded history window, which is a regression signature, ' +
    'not flakiness. Diagnose why it now fails every time instead of adding resilience around it.',
  new_hard_failure:
    'This failed every retry tonight. Treat it as a likely regression from a recent change and look at the application ' +
    'code first, not just the test.',
};

const GUARDRAIL = [
  '**Run it.** Before editing, read `.github/instructions/playwright.instructions.md` in full and use its',
  '"Mandatory: run the test before and after" commands to start core and the app and reproduce. You may only',
  'say you could not run after attempting them; quote the failing command and its output in the PR.',
  '**Guardrail.** Do not resolve this by adding `waitForTimeout`/sleeps, raising `retries` or `timeout`,',
  'loosening an assertion, wrapping the failure in `try`/`catch`, or skipping the test. Prefer Playwright',
  'web-first, auto-retrying assertions (`await expect(locator).toBeVisible()`). If you cannot establish a',
  'root cause, do not guess and do not quarantine: add the diagnostics that would identify it on the next',
  `occurrence, state \`Round type: diagnostics-only\` on its own line in the PR description, and use the PR`,
  'to record what you ruled out and what the next session should look for. You cannot edit labels, so',
  'do not try. A recurrence after a diagnostics-only round is expected and does',
  'not count as a failed fix. Re-run the affected spec(s) at least 10 times before and after',
  '(`--repeat-each=10`) and report the counts honestly in the PR. See',
  '`.github/instructions/playwright.instructions.md` for the full policy and required PR description format.',
].join(' ');

// Caps error/snapshot text length so issue bodies stay within GitHub's size limits.
function truncate(text: string | undefined, max = 4000): string {
  const s = String(text ?? '');
  return s.length > max ? `${s.slice(0, max)}\n... (truncated)` : s;
}

// Pick a fence longer than any backtick run in the payload so error text cannot break out.
function fenced(text: string | undefined): string {
  const body = truncate(text) || '(none captured)';
  const longest = (body.match(/`+/g) ?? []).reduce(
    (m, s) => Math.max(m, s.length),
    0
  );
  const fence = '`'.repeat(Math.max(3, longest + 1));
  return `${fence}\n${body}\n${fence}`;
}

// Builds the `playwright test` command a human/agent can run to reproduce the failure.
function reproCommand(bundle: Bundle): string {
  const files = [...new Set(bundle.tests.map(t => t.file))];
  const projects = [
    ...new Set(bundle.tests.map(t => t.project).filter(Boolean)),
  ];
  const flags = projects.map(p => `--project=${p}`).join(' ');
  return `npx playwright test ${files.join(' ')}${
    flags ? ` ${flags}` : ''
  } --repeat-each=10`;
}

// Renders the full markdown body for a fingerprint's GitHub issue.
function buildIssueBody(decision: Decision, ctx: RunContext): string {
  const b = decision.bundle;
  const lines: (string | null)[] = [
    MARKER(b.fingerprint),
    `**Fingerprint:** \`${b.fingerprint}\` · **Classification:** \`${b.classification}\` · **Route:** \`${decision.route}\` (${decision.reason})`,
    `**Flake rate:** ${b.flakeRate} over the last ${b.historyWindow} recorded nightly run(s)`,
    `**Prior automated fix attempts that recurred:** ${b.priorFixAttempts}`,
    b.diagnosticsAttempts > 0
      ? `**Diagnostics-only rounds so far:** ${b.diagnosticsAttempts} — a previous session added logging instead of guessing at a fix. Read it in the artifacts below before re-investigating.`
      : null,
    '',
    `**Tests sharing this fingerprint (${b.tests.length}):**`,
    ...b.tests.map(
      t => `- \`${t.file}\` — ${t.title} _(${t.project || 'default'})_`
    ),
  ]; // lines stores the initial set of markdown lines for the issue body in an array

  if (b.tests.length > 1) {
    lines.push(
      '',
      '> More than one test shares this fingerprint. Fix the shared root cause once (page object, fixture, or helper) rather than patching each spec.'
    );
  }

  if (b.priorPullRequests.length > 0) {
    lines.push(
      '',
      '**Fixes already attempted for this fingerprint — each one failed to hold:**',
      ...b.priorPullRequests.map(url => `- ${url}`),
      '',
      '> Read these before starting. Repeating an approach that already recurred wastes the attempt and pushes this issue closer to being escalated to a human.'
    );
  }

  lines.push(
    '',
    `> ${CLASSIFICATION_MESSAGES[b.classification]}`,
    '',
    '**Error**',
    fenced(b.error.message),
    '',
    '<details><summary>Stack</summary>',
    '',
    fenced(b.error.stack),
    '',
    '</details>',
    ''
  );

  if (b.pageSnapshot) {
    lines.push(
      '<details><summary>Page accessibility snapshot at the moment of failure</summary>',
      '',
      fenced(b.pageSnapshot),
      '',
      '</details>',
      ''
    );
  }

  lines.push('**Reproduce**', fenced(reproCommand(b)), '');

  const report = ctx.reportUrl
    ? `[\`playwright-report\`](${ctx.reportUrl})`
    : '`playwright-report` (from the run below)';
  lines.push(
    '**Artifacts**',
    b.traceAttachments.length > 0
      ? `- ${report} contains ${b.traceAttachments
          .map(a => `\`${a}\``)
          .join(
            ', '
          )} for the attempt that actually failed, not the retry that passed.`
      : `- ${report} contains the full report for this run.`,
    '- `server-logs-<browser>-<shard>` on the run page has the timestamped Deephaven server log, captured even when the retry passed and the job went green.',
    `- Deephaven server image: \`${ctx.serverVersion}\`.`,
    ''
  );

  if (b.traceAttachments.length > 0) {
    lines.push(
      'Inspect a trace without the GUI:',
      fenced(
        [
          'npx playwright trace open path/to/trace.zip',
          'npx playwright trace actions --grep="expect"',
          'npx playwright trace snapshot <n> --name after',
        ].join('\n')
      ),
      ''
    );
  }

  lines.push(
    `**Run:** ${ctx.runUrl}`,
    `**Commit:** \`${ctx.commit}\` on \`${ctx.branch}\``,
    '',
    decision.route === 'escalate'
      ? `> **Escalated to a human** (${decision.reason}) — this is intentionally not assigned to an agent.\n`
      : null,
    GUARDRAIL
  );

  // null marks an omitted line; '' is a deliberate blank line markdown needs.
  return lines.filter((l): l is string => l !== null).join('\n');
}

// Builds a short, deduped issue title from the fingerprint's test titles.
function buildTitle(bundle: Bundle): string {
  const titles = [...new Set(bundle.tests.map(t => t.title))];
  const shown = titles.slice(0, 2).join(', ');
  const extra = titles.length > 2 ? ` +${titles.length - 2} more` : '';
  return `[e2e] ${shown}${extra}`.slice(0, 240);
}

// Labels applied to a fingerprint's issue based on its classification and route.
function labelsFor(decision: Decision): string[] {
  return [
    BASE_LABEL,
    CLASSIFICATION_LABELS[decision.bundle.classification],
    decision.route === 'escalate' ? HUMAN_LABEL : AGENT_LABEL,
  ];
}

// ---------- GitHub API ----------

// Minimal GitHub REST client authenticated with the given token.
function makeClient(token: string, repository: string): GithubClient {
  const [owner, repo] = (repository ?? '').split('/');
  const api = 'https://api.github.com';
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Shared fetch wrapper: throws on non-2xx, returns null for 204 responses.
  async function request<T>(
    pathname: string,
    opts: { method?: string; body?: string } = {}
  ): Promise<T | null> {
    const res = await fetch(`${api}${pathname}`, { headers, ...opts });
    if (!res.ok) {
      throw new Error(
        `${opts.method ?? 'GET'} ${pathname} -> ${res.status}: ${(
          await res.text()
        ).slice(0, 500)}`
      );
    }
    return res.status === 204 ? null : ((await res.json()) as T);
  }

  return {
    getIssue: number =>
      request<GithubIssue>(`/repos/${owner}/${repo}/issues/${number}`).then(
        issue => issue as GithubIssue
      ),
    updateIssue: (number, patch) =>
      request<GithubIssue>(`/repos/${owner}/${repo}/issues/${number}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    comment: (number, body) =>
      request(`/repos/${owner}/${repo}/issues/${number}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    createIssue: payload =>
      request<GithubIssue>(`/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }).then(issue => issue as GithubIssue),
    // Closed issues are included so a cold cache reopens the original rather than opening a
    // duplicate, which would also reset the fix-attempt count that drives escalation. Sorted
    // by recency because a recurrence is always recent and the page budget is finite.
    async fetchIssuesWithLabel(label: string): Promise<GithubIssue[]> {
      const all: GithubIssue[] = [];
      let page = 1;
      let keepGoing = true;
      while (keepGoing && page <= 5) {
        // eslint-disable-next-line no-await-in-loop
        const batch = await request<GithubIssue[]>(
          `/repos/${owner}/${repo}/issues?state=all&labels=${encodeURIComponent(
            label
          )}&sort=updated&direction=desc&per_page=100&page=${page}`
        );
        all.push(...(batch ?? []));
        keepGoing = Boolean(batch && batch.length >= 100);
        page += 1;
      }
      return all;
    },
    // Pull requests that referenced this issue, i.e. the fixes already attempted for it.
    async fetchLinkedPullRequests(
      number: number
    ): Promise<LinkedPullRequest[]> {
      const events = await request<TimelineEvent[]>(
        `/repos/${owner}/${repo}/issues/${number}/timeline?per_page=100`
      );
      const found = new Map<string, LinkedPullRequest>();
      (events ?? []).forEach(e => {
        const source = e.source?.issue;
        if (
          e.event !== 'cross-referenced' ||
          source?.pull_request === undefined ||
          source.html_url === undefined ||
          source.html_url === ''
        ) {
          return;
        }
        found.set(source.html_url, {
          url: source.html_url,
          body: source.body ?? '',
          mergedAt: source.pull_request.merged_at ?? null,
        });
      });
      return [...found.values()];
    },
    assignAgent:
      COPILOT_ASSIGN_TOKEN === ''
        ? null
        : async (number: number) => {
            // Deliberately not using request(): these calls need the user token, and
            // agent_assignment selects which custom agent picks the issue up.
            const assigneesUrl = `${api}/repos/${owner}/${repo}/issues/${number}/assignees`;
            const agentHeaders = {
              ...headers,
              Authorization: `Bearer ${COPILOT_ASSIGN_TOKEN}`,
              'GraphQL-Features':
                'issues_copilot_assignment_api_support,coding_agent_model_selection',
            };

            // Copilot only starts a session on an unassigned -> assigned transition. Closing an
            // issue does not clear its assignee, so a reopened one still carries the bot from the
            // last attempt and re-POSTing it is a silent no-op. Clear it first to force a new
            // session on a new PR; on a brand-new issue this is a harmless no-op.
            const cleared = await fetch(assigneesUrl, {
              method: 'DELETE',
              headers: agentHeaders,
              body: JSON.stringify({ assignees: [COPILOT_ASSIGNEE] }),
            });
            if (!cleared.ok) {
              console.warn(
                `Could not clear the existing assignee on #${number} (${cleared.status}); a new agent session may not start.`
              );
            }

            const res = await fetch(assigneesUrl, {
              method: 'POST',
              headers: agentHeaders,
              body: JSON.stringify({
                assignees: [COPILOT_ASSIGNEE],
                agent_assignment: {
                  target_repo: repository,
                  base_branch: COPILOT_BASE_BRANCH,
                  custom_agent: COPILOT_CUSTOM_AGENT,
                  model: COPILOT_MODEL,
                },
              }),
            });
            if (!res.ok) {
              throw new Error(
                `POST /issues/${number}/assignees -> ${res.status}: ${(
                  await res.text()
                ).slice(0, 500)}`
              );
            }
            return res.json();
          },
  };
}

// ---------- main ----------

// Parses `--flag value` pairs and the `--dry-run` switch from argv.
function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--dry-run') {
      args.dryRun = true;
    } else if (flag.startsWith('--')) {
      i += 1;
      args[flag.slice(2)] = argv[i];
    }
  }
  return args;
}

// Writes to the GitHub Actions step summary if available, else falls back to stdout.
function writeSummary(markdown: string): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath !== undefined && summaryPath !== '') {
    appendFileSync(summaryPath, markdown);
  } else {
    console.log(markdown);
  }
}

// Entry point: load report + history, classify failures, sync GitHub issues, persist state.
async function main(): Promise<void> {
  const args = parseArgs();
  if (args.report === undefined || args.report === '') {
    console.error(
      'Usage: node nightly-flake-triage.ts --report <path> [--history <path>] [--out <path>] [--dry-run]'
    );
    process.exit(1);
  }

  // Load this run's merged Playwright report and the persisted flake history cache.
  const historyPath = args.history ?? '.test-health/history.json';
  const outPath = args.out ?? '.test-health/decisions.json';
  const report: PlaywrightSuite = JSON.parse(readFileSync(args.report, 'utf8'));
  const history = loadHistory(historyPath);

  // Metadata identifying this CI run, embedded in issue bodies and history records.
  const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
  const repository = process.env.GITHUB_REPOSITORY ?? '';
  const runId = process.env.GITHUB_RUN_ID ?? String(Date.now());
  const ctx: RunContext = {
    runId,
    runUrl: `${serverUrl}/${repository}/actions/runs/${runId}`,
    reportUrl: process.env.REPORT_ARTIFACT_URL ?? '',
    commit: process.env.GITHUB_SHA ?? 'unknown',
    branch: process.env.GITHUB_REF_NAME ?? 'unknown',
    timestamp: new Date().toISOString(),
    serverVersion: process.env.DHC_VERSION ?? 'unknown',
  };

  // No token/repo, or an explicit --dry-run: only write local files, never touch GitHub issues.
  const dryRun =
    args.dryRun ||
    process.env.GITHUB_TOKEN === undefined ||
    process.env.GITHUB_TOKEN === '' ||
    repository === '';
  if (dryRun) console.log('Dry run: no issues will be created or updated.');
  const gh = dryRun
    ? null
    : makeClient(process.env.GITHUB_TOKEN as string, repository);

  // ---- 1. walk the merged report ----

  // Populated by walk() below.
  const failing: FailingTest[] = [];
  const counts: Record<string, number> = {
    total: 0,
    expected: 0,
    flaky: 0,
    unexpected: 0,
    skipped: 0,
  };

  // Recursively flattens the report's suite tree into per-test run records and failures.
  function walk(suite: PlaywrightSuite, titlePath: string[] = []): void {
    (suite.specs ?? []).forEach(spec => {
      (spec.tests ?? []).forEach(test => {
        const { status } = test; // 'expected' | 'unexpected' | 'flaky' | 'skipped'
        if (status === 'skipped') {
          counts.skipped += 1;
          return;
        }
        counts.total += 1;
        counts[status] = (counts[status] ?? 0) + 1;

        const project = test.projectName ?? '';
        // Keyed on describe-block ancestry + own title, so moving a test
        // within its file doesn't silently reset its accumulated flake history.
        const testKey = `${spec.file}::${[...titlePath, spec.title].join(
          ' > '
        )}::${project}`;
        const lastResult = test.results?.at(-1);
        // For a 'flaky' test the LAST result is the retry that finally passed and
        // carries no error -- walk backwards for the attempt that actually failed.
        const failingResult =
          test.results
            ?.slice()
            .reverse()
            .find(r => r.error !== undefined) ?? lastResult;

        recordRun(history, testKey, {
          ...ctx,
          status,
          durationMs: lastResult?.duration ?? 0,
        });

        if (status === 'flaky' || status === 'unexpected') {
          const error = failingResult?.error ?? {};
          const attachments = failingResult?.attachments ?? [];
          failing.push({
            testKey,
            file: spec.file,
            title: spec.title,
            project,
            status,
            fp: fingerprint(error),
            error: {
              message: stripAnsi(error.message ?? ''),
              stack: stripAnsi(error.stack ?? ''),
            },
            pageSnapshot: stripAnsi(extractErrorContext(error, attachments)),
            attachments: attachments
              .map(a => a.name ?? a.path)
              .filter((a): a is string => Boolean(a)),
          });
        }
      });
    });
    (suite.suites ?? []).forEach(child =>
      walk(
        child,
        suite.title !== undefined ? [...titlePath, suite.title] : titlePath
      )
    );
  }
  walk(report);

  // If a large fraction of the suite failed at once, it's more likely infra than any one flake.
  const broadFailureRatio =
    counts.total > 0 ? failing.length / counts.total : 0;
  console.log(
    `${counts.total} test(s) ran: ${counts.expected ?? 0} passed, ${
      counts.flaky ?? 0
    } flaky, ${counts.unexpected ?? 0} failed.`
  );

  // ---- 2. group by fingerprint and decide ----

  // Group failing tests by fingerprint so a shared root cause gets one issue, not one per test.
  const groups = new Map<string, FailingTest[]>();
  failing.forEach(f => {
    if (!groups.has(f.fp)) groups.set(f.fp, []);
    groups.get(f.fp)?.push(f);
  });

  // Compute flake rate, classification, and routing decision for each fingerprint group.
  const decisions: Decision[] = [...groups.entries()].map(([fp, group]) => {
    const state = fingerprintState(history, fp);
    // Accumulate every test ever seen under this fingerprint, not just tonight's failures --
    // otherwise a sibling test that shares the root cause but passed tonight contributes
    // nothing, and the rate swings based on which subset of tests happened to fail tonight.
    state.testKeys = [
      ...new Set([...(state.testKeys ?? []), ...group.map(g => g.testKey)]),
    ];
    const { flakeRate, historyWindow, hardFailureStreak, wasFlaky } =
      groupStats(history, state.testKeys);
    // 'unexpected' dominates: if any project failed outright, treat the group as a hard failure.
    const status: FailingStatus = group.some(g => g.status === 'unexpected')
      ? 'unexpected'
      : 'flaky';
    const classification = classify(
      status,
      flakeRate,
      historyWindow,
      hardFailureStreak,
      wasFlaky
    );
    const decision = decide({
      testFiles: [...new Set(group.map(g => g.file))],
      classification,
      state,
      broadFailureRatio,
    });

    return {
      ...decision,
      bundle: {
        fingerprint: fp,
        status,
        classification,
        tests: group.map(g => ({
          file: g.file,
          title: g.title,
          project: g.project,
          status: g.status,
        })),
        error: group[0].error,
        pageSnapshot: group.find(g => g.pageSnapshot)?.pageSnapshot ?? '',
        flakeRate: Number(flakeRate.toFixed(2)),
        historyWindow,
        priorFixAttempts: attemptsWithOutcome(state, 'recurred').length,
        diagnosticsAttempts: attemptsWithOutcome(state, 'instrumented').length,
        priorPullRequests: [],
        traceAttachments: [...new Set(group.flatMap(g => g.attachments))],
      },
    };
  });

  // ---- 3. refresh tracked issue state, record held/recurred outcomes ----

  // Re-read open/closed state from GitHub: an issue may have been closed by a human or by an
  // agent's merged PR since the last run, and the cached history has no way to know that.
  const seenThisRun = new Set(groups.keys());
  // Fingerprints whose closing round only added diagnostics, per the merged PR's declaration or
  // a manually applied label.
  const diagnosticsOnly = new Set<string>();
  if (gh) {
    // Only fingerprints with a previously opened issue need their GitHub state refreshed.
    const tracked = Object.entries(history.fingerprints)
      .filter(([, s]) => s.issueNumber)
      .sort(([fpA, a], [fpB, b]) => {
        // Prioritize fingerprints failing this run (their issueState decides reopening below),
        // then the rest by recency, so a long tail of old tracked issues can't crowd out the
        // refreshes that actually matter once the list exceeds MAX_ISSUE_STATE_REFRESHES.
        const seenA = seenThisRun.has(fpA);
        const seenB = seenThisRun.has(fpB);
        if (seenA !== seenB) return seenA ? -1 : 1;
        return (
          (Date.parse(b.lastSeenAt ?? '') || 0) -
          (Date.parse(a.lastSeenAt ?? '') || 0)
        );
      })
      .slice(0, MAX_ISSUE_STATE_REFRESHES);

    await Promise.all(
      tracked.map(async ([fp, state]) => {
        try {
          const issue = await gh.getIssue(state.issueNumber as number);
          state.issueState = issue.state;
          if (issue.labels?.some(l => l.name === DIAGNOSTICS_LABEL) === true) {
            diagnosticsOnly.add(fp);
          } else if (issue.state === 'closed' && seenThisRun.has(fp)) {
            // Only a recurrence needs judging, so only those pay for the timeline call.
            const merged = (await gh.fetchLinkedPullRequests(issue.number))
              .filter(pr => pr.mergedAt !== null)
              .sort(
                (a, b) =>
                  Date.parse(b.mergedAt ?? '') - Date.parse(a.mergedAt ?? '')
              );
            if (DIAGNOSTICS_ROUND_PATTERN.test(merged[0]?.body ?? '')) {
              diagnosticsOnly.add(fp);
            }
          }
        } catch (err) {
          console.warn(
            `Could not refresh issue #${state.issueNumber} for ${fp}: ${
              (err as Error).message
            }`
          );
        }
      })
    );
  }

  // Judge the previous fix for every fingerprint whose issue was closed: it recurred if the
  // failure is back tonight, or held once HOLD_CONFIRM_RUNS clean runs have passed since.
  Object.entries(history.fingerprints)
    .filter(
      ([, state]) =>
        state.issueNumber !== undefined && state.issueState === 'closed'
    )
    .forEach(([fp, state]) => {
      if (seenThisRun.has(fp)) {
        // Closed and back again. A diagnostics-only round expects exactly this, so it is
        // recorded apart from real fix attempts and leaves the escalation budget intact.
        state.fixAttempts.push({
          outcome: diagnosticsOnly.has(fp) ? 'instrumented' : 'recurred',
          issueNumber: state.issueNumber as number,
          runId: ctx.runId,
          at: ctx.timestamp,
        });
        state.cleanRunsSinceClose = 0;
      } else {
        state.cleanRunsSinceClose = (state.cleanRunsSinceClose ?? 0) + 1;
        // Ignore diagnostics rounds when looking back, or one at the tail would hide an
        // earlier 'held' and let a duplicate be appended.
        const alreadyHeld =
          state.fixAttempts.filter(a => a.outcome !== 'instrumented').at(-1)
            ?.outcome === 'held';
        if (state.cleanRunsSinceClose >= HOLD_CONFIRM_RUNS && !alreadyHeld) {
          state.fixAttempts.push({
            outcome: 'held',
            issueNumber: state.issueNumber as number,
            runId: ctx.runId,
            at: ctx.timestamp,
          });
        }
      }
    });

  // Recount after recording recurrences so escalation takes effect on this run.
  decisions.forEach(decision => {
    const state = history.fingerprints[decision.bundle.fingerprint];
    decision.bundle.priorFixAttempts = attemptsWithOutcome(
      state,
      'recurred'
    ).length;
    decision.bundle.diagnosticsAttempts = attemptsWithOutcome(
      state,
      'instrumented'
    ).length;
    if (
      decision.route === 'auto_fix_candidate' &&
      decision.bundle.priorFixAttempts >= ESCALATE_AFTER_ATTEMPTS
    ) {
      decision.route = 'escalate';
      decision.reason = 'repeat_fix_attempts_failed';
    }
  });

  // Collect the PRs that already failed to fix each recurring fingerprint. Only fingerprints
  // with a recorded recurrence are worth the API call, and the list goes into the issue body
  // below so the next session starts from what was already tried.
  if (gh) {
    await Promise.all(
      decisions
        .filter(d => d.bundle.priorFixAttempts > 0)
        .map(async decision => {
          const { issueNumber } =
            history.fingerprints[decision.bundle.fingerprint];
          if (issueNumber === undefined) return;
          try {
            decision.bundle.priorPullRequests = (
              await gh.fetchLinkedPullRequests(issueNumber)
            ).map(pr => pr.url);
          } catch (err) {
            console.warn(
              `Could not list prior fix PRs for #${issueNumber}: ${
                (err as Error).message
              }`
            );
          }
        })
    );
  }

  // ---- 4. open or update one issue per fingerprint ----

  // Rank agent candidates by flake rate so the cap spends its budget on the fingerprints with
  // the worst track record; ties break toward the one affecting more tests. Only
  // auto_fix_candidate routes are eligible -- escalate/no_action stay off the agent's plate.
  const assignable = new Set(
    decisions
      .filter(d => d.route === 'auto_fix_candidate')
      .sort(
        (a, b) =>
          b.bundle.flakeRate - a.bundle.flakeRate ||
          b.bundle.tests.length - a.bundle.tests.length
      )
      .slice(0, MAX_AGENT_ASSIGNMENTS_PER_RUN)
      .map(d => d.bundle.fingerprint)
  );

  // Fall back to matching by the embedded marker if history lost track of an issue number
  // (e.g. a cold cache), so a fingerprint doesn't get a duplicate issue opened for it.
  const existingByFingerprint = new Map<
    string,
    { number: number; state: 'open' | 'closed' }
  >();
  if (gh) {
    try {
      const known = await gh.fetchIssuesWithLabel(BASE_LABEL);
      known.forEach(issue => {
        // An agent's PR often quotes the issue body, marker included, and the issues endpoint
        // returns PRs too -- matching one would make us comment on the PR instead of the issue.
        if (issue.pull_request !== undefined) return;
        const match = issue.body?.match(
          /<!-- test-health-fingerprint: ([0-9a-f]+) -->/
        );
        // Results are newest-first, so the first match for a fingerprint is the live one.
        if (match && !existingByFingerprint.has(match[1])) {
          existingByFingerprint.set(match[1], {
            number: issue.number,
            state: issue.state,
          });
        }
      });
    } catch (err) {
      console.warn(
        `Could not list existing issues, relying on cached history only: ${
          (err as Error).message
        }`
      );
    }
  }

  // Process fingerprints one at a time (not Promise.all) to avoid racing GitHub issue
  // creation/updates for fingerprints that happen to resolve to the same issue.
  await decisions.reduce(async (prevPromise, decision) => {
    await prevPromise;

    const fp = decision.bundle.fingerprint;
    const state = fingerprintState(history, fp);
    state.lastSeenAt = ctx.timestamp;
    state.lastSeenRunId = ctx.runId;

    if (decision.route === 'no_action') {
      console.log(`  [no_action] ${fp} (${decision.reason})`);
      return;
    }

    const body = buildIssueBody(decision, ctx);
    const labels = labelsFor(decision);
    const known = existingByFingerprint.get(fp);
    const issueNumber = state.issueNumber ?? known?.number;
    // Keep the rendered issue on the decision so a dry run is reviewable.
    decision.rendered = { title: buildTitle(decision.bundle), labels, body };
    const wantsAgent = assignable.has(fp);

    if (dryRun) {
      console.log(
        `  [${decision.route}] ${fp} (${decision.reason}) - would ${
          issueNumber !== undefined ? `update #${issueNumber}` : 'open an issue'
        }${wantsAgent ? ' and assign the agent' : ''}`
      );
      decision.issue = issueNumber ?? null;
      decision.assigned = wantsAgent;
      return;
    }

    // Only hand the issue to an agent when a fresh session is warranted: a brand-new issue, or
    // one reopening because a previous fix didn't hold. A still-failing open issue already has
    // a session or a human looking at it.
    let shouldAssign = false;

    try {
      if (issueNumber !== undefined) {
        // Fall back to the freshly fetched state when the cache has no record of this issue.
        const reopening = (state.issueState ?? known?.state) === 'closed';
        await gh?.updateIssue(issueNumber, {
          body,
          labels,
          ...(reopening ? { state: 'open' } : {}),
        });
        await gh?.comment(
          issueNumber,
          reopening
            ? `Recurred after this issue was closed — run ${ctx.runUrl}. Reopening; the previous fix did not hold. The earlier pull request is left closed — this gets a fresh investigation rather than a reopened branch.`
            : `Still failing — run ${ctx.runUrl}.`
        );
        state.issueState = 'open';
        state.issueNumber = issueNumber;
        decision.issue = issueNumber;
        shouldAssign = wantsAgent && reopening;
        console.log(
          `  [${decision.route}] ${fp} -> ${
            reopening ? 'reopened' : 'updated'
          } #${issueNumber}`
        );
      } else {
        const created = await gh?.createIssue({
          title: buildTitle(decision.bundle),
          body,
          labels,
        });
        if (created) {
          state.issueNumber = created.number;
          state.issueState = 'open';
          state.openedAt = ctx.timestamp;
          decision.issue = created.number;
          shouldAssign = wantsAgent;
          console.log(
            `  [${decision.route}] ${fp} -> opened #${created.number}`
          );
        }
      }
    } catch (err) {
      console.error(
        `Failed to sync issue for ${fp}: ${(err as Error).message}`
      );
      decision.issueError = (err as Error).message;
    }

    if (shouldAssign && decision.issue != null) {
      if (gh?.assignAgent == null) {
        console.log(
          `  [${decision.route}] ${fp} -> #${decision.issue} not assigned (COPILOT_ASSIGN_TOKEN unset)`
        );
      } else {
        try {
          await gh.assignAgent(decision.issue);
          decision.assigned = true;
          console.log(
            `  [${decision.route}] ${fp} -> assigned ${COPILOT_CUSTOM_AGENT} to #${decision.issue}`
          );
        } catch (err) {
          console.error(
            `Failed to assign agent for ${fp}: ${(err as Error).message}`
          );
          decision.assignError = (err as Error).message;
        }
      }
    }
  }, Promise.resolve());

  // ---- 5. prune, persist, summarize ----

  // Drop fingerprints untouched for a long time, unless they still have an open issue.
  const cutoff = Date.now() - PRUNE_AFTER_DAYS * 86400_000;
  Object.entries(history.fingerprints).forEach(([fp, state]) => {
    const lastSeen = Date.parse(state.lastSeenAt ?? '') || 0;
    if (lastSeen < cutoff && state.issueState !== 'open') {
      delete history.fingerprints[fp];
    }
  });

  // Drop test keys that have stopped reporting entirely -- deleted or renamed tests would
  // otherwise keep their entries in the cache forever, since nothing ever appends to them again.
  Object.entries(history.tests).forEach(([testKey, entry]) => {
    const lastRun = Date.parse(entry.runs.at(-1)?.timestamp ?? '') || 0;
    if (lastRun < cutoff) {
      delete history.tests[testKey];
    }
  });

  // Surviving fingerprints accumulate testKeys forever, so drop the ones just pruned above.
  Object.values(history.fingerprints).forEach(state => {
    state.testKeys = state.testKeys?.filter(key => key in history.tests);
  });

  saveHistory(historyPath, history);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify({ ...ctx, counts, broadFailureRatio, decisions }, null, 2)
  );

  // Convenience filter for tallying decisions by route in the job summary below.
  const byRoute = (route: Route): Decision[] =>
    decisions.filter(d => d.route === route);
  const agentEligible = byRoute('auto_fix_candidate').length;
  const agentAssigned = decisions.filter(d => d.assigned === true).length;
  writeSummary(
    `${[
      '### Nightly E2E triage',
      '',
      `- Ran ${counts.total} test(s): ${counts.expected ?? 0} passed, ${
        counts.flaky ?? 0
      } flaky, ${counts.unexpected ?? 0} failed`,
      `- ${failing.length} failing test(s) grouped into ${decisions.length} fingerprint(s)`,
      `- Routed: ${agentEligible} agent-eligible, ${
        byRoute('escalate').length
      } escalated to a human, ${byRoute('no_action').length} suppressed`,
      `- Agent assignments this run: ${agentAssigned} of ${agentEligible} eligible (cap ${MAX_AGENT_ASSIGNMENTS_PER_RUN}, ranked by flake rate)`,
      agentAssigned < agentEligible
        ? '- _An agent is only assigned when an issue is opened or reopened; eligible fingerprints whose issue was already open keep the session or human already working on them._'
        : null,
      COPILOT_ASSIGN_TOKEN === ''
        ? '- _`COPILOT_ASSIGN_TOKEN` is unset — issues were labeled but not assigned to an agent._'
        : null,
      dryRun ? '- _Dry run — no issues were created or updated._' : null,
      broadFailureRatio > BROAD_FAILURE_RATIO
        ? `- ⚠️ ${(broadFailureRatio * 100).toFixed(
            0
          )}% of the suite failed at once; treated as infrastructure, no issues opened.`
        : null,
      '',
      ...(decisions.length
        ? [
            '| Route | Fingerprint | Classification | Flake rate | Tests | Issue | Agent |',
            '| --- | --- | --- | --- | --- | --- | --- |',
            ...decisions.map(
              d =>
                `| ${d.route} | \`${d.bundle.fingerprint}\` | ${
                  d.bundle.classification
                } | ${d.bundle.flakeRate} (${d.bundle.historyWindow} runs) | ${
                  d.bundle.tests.length
                } | ${d.issue != null ? `#${d.issue}` : '—'} | ${
                  d.assigned === true ? 'assigned' : '—'
                } |`
            ),
          ]
        : []),
      '',
    ]
      .filter(l => l !== null)
      .join('\n')}\n`
  );
}

await main();
