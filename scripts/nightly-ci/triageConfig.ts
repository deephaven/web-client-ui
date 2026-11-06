import type { Classification } from './triageTypes.ts';

export const HISTORY_WINDOW = Number(process.env.HISTORY_WINDOW ?? 20);
export const ESCALATE_AFTER_ATTEMPTS = Number(
  process.env.ESCALATE_AFTER_ATTEMPTS ?? 2
);
// Ratio of failed tests in a single night that signals a wider failure problem.
export const BROAD_FAILURE_RATIO = Number(
  process.env.BROAD_FAILURE_RATIO ?? 0.3
);
export const CHRONIC_FLAKE_RATE = Number(process.env.CHRONIC_FLAKE_RATE ?? 0.3);
export const PERSISTENT_FAILURE_RATE = Number(
  process.env.PERSISTENT_FAILURE_RATE ?? 0.9
);
// Minimum number of runs required to establish a trend as persistent/chronic.
export const MIN_RUNS_FOR_TREND = Number(process.env.MIN_RUNS_FOR_TREND ?? 5);
// Consecutive outright-failure nights a historically flaky test needs before it's treated as a
// hard failure instead of just another flake; a test with no flaky history skips this grace period.
export const HARD_FAILURE_STREAK_THRESHOLD = Number(
  process.env.HARD_FAILURE_STREAK_THRESHOLD ?? 2
);
export const HOLD_CONFIRM_RUNS = Number(process.env.HOLD_CONFIRM_RUNS ?? 5);
export const PRUNE_AFTER_DAYS = Number(process.env.PRUNE_AFTER_DAYS ?? 60);
export const MAX_ISSUE_STATE_REFRESHES = 50; // bound the API calls spent re-checking tracked issues

// Assigning Copilot requires a user-to-server token; the Actions-provided GITHUB_TOKEN is a
// server-to-server token and is rejected by the assignment API, so this is a separate secret.
// Leave it unset to keep the pipeline label-only.
export const COPILOT_ASSIGN_TOKEN = process.env.COPILOT_ASSIGN_TOKEN ?? '';
export const COPILOT_ASSIGNEE = 'copilot-swe-agent[bot]';
export const COPILOT_CUSTOM_AGENT =
  process.env.COPILOT_CUSTOM_AGENT ?? 'playwright-flake-investigator';
export const COPILOT_BASE_BRANCH = process.env.COPILOT_BASE_BRANCH ?? 'main';
export const COPILOT_MODEL = process.env.COPILOT_MODEL ?? 'claude-sonnet-5.5';
// Cap how many fingerprints get handed to an agent per run so one bad night can't open a
// dozen concurrent sessions and PRs. Adjust as needed.
export const MAX_AGENT_ASSIGNMENTS_PER_RUN = Number(
  process.env.MAX_AGENT_ASSIGNMENTS_PER_RUN ?? 8
);

// Failures under these paths always go to a human, never to an agent.
export const SENSITIVE_PATH_PATTERNS = (
  process.env.SENSITIVE_PATH_PATTERNS ?? ''
)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => new RegExp(s, 'i'));

export const BASE_LABEL = 'e2e-failure';
export const AGENT_LABEL = 'auto-investigate';
export const HUMAN_LABEL = 'needs-human';
// Agents can't edit labels, so their PRs declare a diagnostics-only round in the description and
// triage reads it from there. The label stays as a manual override for people, and is dropped by
// the next labelsFor() update so each round is counted exactly once.
export const DIAGNOSTICS_LABEL = 'diagnostics-added';
export const DIAGNOSTICS_ROUND_PATTERN =
  /^\s*Round type:\s*`?diagnostics-only`?\s*$/im;
export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  chronic_flake: 'chronic-flake',
  new_flake: 'new-flake',
  persistent_failure: 'persistent-failure',
  new_hard_failure: 'new-hard-failure',
};

export const MARKER = (fp: string): string =>
  `<!-- test-health-fingerprint: ${fp} -->`;
