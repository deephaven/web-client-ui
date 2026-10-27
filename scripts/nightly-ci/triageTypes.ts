export type TestStatus = 'expected' | 'unexpected' | 'flaky' | 'skipped';
export type FailingStatus = 'flaky' | 'unexpected';
// 'instrumented' marks an attempt that deliberately only added diagnostics, so the failure
// coming back is the expected outcome and must not spend one of the tries before escalation.
export type FixOutcome = 'recurred' | 'held' | 'instrumented';
export type Classification =
  | 'chronic_flake'
  | 'new_flake'
  | 'persistent_failure'
  | 'new_hard_failure';
export type Route = 'no_action' | 'escalate' | 'auto_fix_candidate';

// Identifies which CI run produced a history record or issue comment.
export interface RunContext {
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
export interface RunRecord extends RunContext {
  status: TestStatus;
  durationMs: number;
}

// Rolling window of recent run outcomes for one test key.
export interface TestHistoryEntry {
  runs: RunRecord[];
}

// History signals for one fingerprint, all derived in a single pass over its tests.
export interface GroupStats {
  flakeRate: number;
  historyWindow: number;
  hardFailureStreak: number;
  wasFlaky: boolean;
}

// Whether closing a fingerprint's issue actually fixed it or the failure came back.
export interface FixAttempt {
  outcome: FixOutcome;
  issueNumber: number;
  runId: string;
  at: string;
}

// Persisted, cross-run state tracked for one fingerprint.
export interface FingerprintState {
  fixAttempts: FixAttempt[];
  cleanRunsSinceClose: number;
  testKeys?: string[];
  issueNumber?: number;
  issueState?: 'open' | 'closed';
  lastSeenAt?: string;
  lastSeenRunId?: string;
  openedAt?: string;
  // Diagnostics-only PRs already counted as an exempt round; each may exempt only one recurrence.
  consumedDiagnosticsPrs?: string[];
}

// Root shape of the history.json cache restored/saved via actions/cache.
export interface HistoryStore {
  tests: Record<string, TestHistoryEntry>;
  fingerprints: Record<string, FingerprintState>;
}

// ANSI-stripped error message/stack captured for a failing test.
export interface ErrorInfo {
  message: string;
  stack: string;
}

// Minimal identity of one test contributing to a fingerprint's bundle.
export interface TestRef {
  file: string;
  title: string;
  project: string;
  status: FailingStatus;
}

// Aggregated view of one fingerprint's failures, used to render its issue body.
export interface Bundle {
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
export interface Decision {
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
export interface FailingTest {
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
export interface PlaywrightErrorContext {
  value?: string;
  text?: string;
  body?: string;
}

// Failure details for a single test-result attempt.
export interface PlaywrightError {
  message?: string;
  stack?: string;
  errorContext?: string | PlaywrightErrorContext;
}

// A file or inline blob attached to a result (traces, screenshots, error context snapshots).
export interface PlaywrightAttachment {
  name?: string;
  path?: string;
  body?: string;
}

// One attempt (initial run or retry) of a test.
export interface PlaywrightResult {
  duration?: number;
  error?: PlaywrightError;
  attachments?: PlaywrightAttachment[];
}

// A test as executed under one Playwright project (e.g. one browser).
export interface PlaywrightTest {
  status: TestStatus;
  projectName?: string;
  results?: PlaywrightResult[];
}

// One `test()` definition and its per-project results.
export interface PlaywrightSpec {
  file: string;
  title: string;
  tests?: PlaywrightTest[];
}

// A describe block or file grouping, recursively containing specs and child suites.
export interface PlaywrightSuite {
  title?: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

// Fields read back from the GitHub REST API for an issue.
export interface GithubIssue {
  number: number;
  state: 'open' | 'closed';
  body?: string;
  labels?: { name?: string }[];
  assignees?: { login?: string }[];
  // Present only when the item is really a pull request; the issues endpoint returns both.
  pull_request?: unknown;
}

// Minimal shape of the cross-referenced entries in an issue's timeline.
export interface TimelineEvent {
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
export interface LinkedPullRequest {
  url: string;
  body: string;
  mergedAt: string | null;
}

// Thin wrapper over the subset of the GitHub REST API this script needs.
export interface GithubClient {
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
export interface CliArgs {
  dryRun: boolean;
  report?: string;
  history?: string;
  out?: string;
  [flag: string]: string | boolean | undefined;
}
