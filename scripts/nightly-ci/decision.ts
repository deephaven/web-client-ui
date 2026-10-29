import { attemptsWithOutcome } from './history.ts';
import {
  MIN_RUNS_FOR_TREND,
  HARD_FAILURE_STREAK_THRESHOLD,
  PERSISTENT_FAILURE_RATE,
  CHRONIC_FLAKE_RATE,
  SENSITIVE_PATH_PATTERNS,
  BROAD_FAILURE_RATIO,
  ESCALATE_AFTER_ATTEMPTS,
} from './triageConfig.ts';
import type {
  FailingStatus,
  Classification,
  FingerprintState,
  Route,
} from './triageTypes.ts';

// Labels a fingerprint as new/chronic flake or new/persistent hard failure based on its history.
export function classify(
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
export function decide({
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
