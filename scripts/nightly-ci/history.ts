/* eslint-disable no-console, no-param-reassign */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type {
  HistoryStore,
  RunRecord,
  TestHistoryEntry,
  FingerprintState,
  FixOutcome,
  FixAttempt,
  GroupStats,
} from './triageTypes.ts';
import { HISTORY_WINDOW } from './triageConfig.ts';

// Fresh history store, used when there's no cache to restore from (a cold cache).
export function emptyHistory(): HistoryStore {
  return { tests: {}, fingerprints: {} };
}

// Reads history.json from disk, falling back to an empty store on a cold cache or bad JSON.
export function loadHistory(historyPath: string): HistoryStore {
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

export function saveHistory(historyPath: string, history: HistoryStore): void {
  mkdirSync(path.dirname(historyPath), { recursive: true });
  writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

// Appends this run's outcome to a test's history, trimming to the rolling window.
export function recordRun(
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
export function fingerprintState(
  history: HistoryStore,
  fp: string
): FingerprintState {
  history.fingerprints[fp] ??= { fixAttempts: [], cleanRunsSinceClose: 0 };
  return history.fingerprints[fp];
}

export function attemptsWithOutcome(
  state: FingerprintState | undefined,
  outcome: FixOutcome
): FixAttempt[] {
  return (state?.fixAttempts ?? []).filter(a => a.outcome === outcome);
}

// Aggregate across every test sharing a fingerprint -- one root cause can span
// several specs and several browser projects.
export function groupStats(
  history: HistoryStore,
  testKeys: string[]
): GroupStats {
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
