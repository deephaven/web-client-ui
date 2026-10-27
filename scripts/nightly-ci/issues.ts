import {
  AGENT_LABEL,
  BASE_LABEL,
  CLASSIFICATION_LABELS,
  HUMAN_LABEL,
  MARKER,
} from './triageConfig.ts';
import type {
  Classification,
  Bundle,
  Decision,
  RunContext,
} from './triageTypes.ts';

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
export function buildIssueBody(decision: Decision, ctx: RunContext): string {
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
      'Open a trace in the trace viewer (needs a display):',
      fenced('npx playwright show-trace path/to/trace.zip'),
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
export function buildTitle(bundle: Bundle): string {
  const titles = [...new Set(bundle.tests.map(t => t.title))];
  const shown = titles.slice(0, 2).join(', ');
  const extra = titles.length > 2 ? ` +${titles.length - 2} more` : '';
  return `[e2e] ${shown}${extra}`.slice(0, 240);
}

// Labels applied to a fingerprint's issue based on its classification and route.
export function labelsFor(decision: Decision): string[] {
  return [
    BASE_LABEL,
    CLASSIFICATION_LABELS[decision.bundle.classification],
    decision.route === 'escalate' ? HUMAN_LABEL : AGENT_LABEL,
  ];
}
