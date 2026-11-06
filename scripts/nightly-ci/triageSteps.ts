/* eslint-disable no-console, no-param-reassign */
import type {
  Decision,
  FailingStatus,
  FailingTest,
  FixOutcome,
  GithubClient,
  HistoryStore,
  PlaywrightSuite,
  Route,
  RunContext,
  TriageState,
} from './triageTypes.ts';
import {
  BASE_LABEL,
  BROAD_FAILURE_RATIO,
  COPILOT_ASSIGN_TOKEN,
  DIAGNOSTICS_LABEL,
  DIAGNOSTICS_ROUND_PATTERN,
  ESCALATE_AFTER_ATTEMPTS,
  HOLD_CONFIRM_RUNS,
  MAX_AGENT_ASSIGNMENTS_PER_RUN,
  MAX_ISSUE_STATE_REFRESHES,
  PRUNE_AFTER_DAYS,
} from './triageConfig.ts';
import {
  extractErrorContext,
  fingerprint,
  stripAnsi,
} from './fingerprinting.ts';
import {
  attemptsWithOutcome,
  fingerprintState,
  groupStats,
  recordRun,
} from './history.ts';
import { classify, decide } from './decision.ts';

// ---------- 1. walk the merged report ----------

// Flattens the report's suite tree into per-test run records (written to history) and failures.
export function walkReport(
  report: PlaywrightSuite,
  history: HistoryStore,
  ctx: RunContext
): { failing: FailingTest[]; counts: Record<string, number> } {
  const failing: FailingTest[] = [];
  const counts: Record<string, number> = {
    total: 0,
    expected: 0,
    flaky: 0,
    unexpected: 0,
    skipped: 0,
  };

  // Recursive flattening of the suite tree into per-test run records and failures.
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
        child.title !== undefined ? [...titlePath, child.title] : titlePath
      )
    );
  }

  // Run recursive walk from report root, and return the failing tests and counts.
  walk(report);
  return { failing, counts };
}

// ---------- 2. group by fingerprint and decide ----------

// Computes flake rate, classification, and routing for each fingerprint group.
export function buildDecisions(
  failing: FailingTest[],
  history: HistoryStore,
  broadFailureRatio: number
): Decision[] {
  // One issue per shared root cause, not one per test.
  const groups = new Map<string, FailingTest[]>();
  failing.forEach(f => {
    if (!groups.has(f.fp)) groups.set(f.fp, []);
    groups.get(f.fp)?.push(f);
  });

  return [...groups.entries()].map(([fp, group]) => {
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
}

// ---------- 3. reconcile tracked issue state ----------

// Matches by the embedded marker so a cold cache that lost an issue number doesn't open a
// duplicate issue for the same fingerprint.
export async function fetchExistingIssues(
  gh: GithubClient
): Promise<TriageState['existingByFingerprint']> {
  const existing: TriageState['existingByFingerprint'] = new Map();
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
      if (match && !existing.has(match[1])) {
        existing.set(match[1], { number: issue.number, state: issue.state });
      }
    });
  } catch (err) {
    console.warn(
      `Could not list existing issues, relying on cached history only: ${
        (err as Error).message
      }`
    );
  }
  return existing;
}

// Re-reads open/closed state from GitHub: an issue may have been closed by a human or by an
// agent's merged PR since the last run, and the cached history has no way to know that.
export async function reconcileIssueState(state: TriageState): Promise<void> {
  const {
    history,
    gh,
    seenThisRun,
    existingByFingerprint,
    diagnosticsOnly,
    diagnosticsPrByFp,
  } = state;

  // The per-issue refresh below is capped, so take open/closed state from the listing first;
  // otherwise an issue skipped by the cap keeps a stale cached state through recurrence accounting.
  Object.entries(history.fingerprints).forEach(([fp, fpState]) => {
    const listed = existingByFingerprint.get(fp);
    if (listed === undefined) return;
    fpState.issueNumber ??= listed.number;
    if (fpState.issueNumber === listed.number) {
      fpState.issueState = listed.state;
    }
  });

  if (!gh) return;

  // Only fingerprints with a previously opened issue need their GitHub state refreshed.
  const tracked = Object.entries(history.fingerprints)
    .filter(([, s]) => s.issueNumber)
    .sort(([fpA, a], [fpB, b]) => {
      // Prioritize fingerprints failing this run (their issueState decides reopening),
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
    tracked.map(async ([fp, fpState]) => {
      try {
        const issue = await gh.getIssue(fpState.issueNumber as number);
        fpState.issueState = issue.state;
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
          const latest = merged[0];
          if (
            latest !== undefined &&
            DIAGNOSTICS_ROUND_PATTERN.test(latest.body) &&
            !(fpState.consumedDiagnosticsPrs ?? []).includes(latest.url)
          ) {
            diagnosticsOnly.add(fp);
            diagnosticsPrByFp.set(fp, latest.url);
          }
        }
      } catch (err) {
        console.warn(
          `Could not refresh issue #${fpState.issueNumber} for ${fp}: ${
            (err as Error).message
          }`
        );
      }
    })
  );
}

// Judges the previous fix for every fingerprint whose issue was closed: it recurred if the
// failure is back tonight, or held once HOLD_CONFIRM_RUNS clean runs have passed since.
// A recurrence is only recorded once the issue is actually reopened, otherwise a suppressed
// or failed reopen would count the same closure again on a later night.
export function judgePreviousFixes(state: TriageState): void {
  const { history, ctx, decisions, seenThisRun, diagnosticsOnly } = state;
  const decisionByFp = new Map(decisions.map(d => [d.bundle.fingerprint, d]));
  Object.entries(history.fingerprints)
    .filter(
      ([, fpState]) =>
        fpState.issueNumber !== undefined && fpState.issueState === 'closed'
    )
    .forEach(([fp, fpState]) => {
      if (seenThisRun.has(fp)) {
        fpState.cleanRunsSinceClose = 0;
        if (decisionByFp.get(fp)?.route === 'no_action') return;
        // A diagnostics-only round expects to recur, so it is recorded apart from real fix
        // attempts and leaves the escalation budget intact.
        const outcome: FixOutcome = diagnosticsOnly.has(fp)
          ? 'instrumented'
          : 'recurred';
        state.pendingRecurrences.set(fp, outcome);
      } else {
        fpState.cleanRunsSinceClose = (fpState.cleanRunsSinceClose ?? 0) + 1;
        // Ignore diagnostics rounds when looking back, or one at the tail would hide an
        // earlier 'held' and let a duplicate be appended.
        const alreadyHeld =
          fpState.fixAttempts.filter(a => a.outcome !== 'instrumented').at(-1)
            ?.outcome === 'held';
        if (fpState.cleanRunsSinceClose >= HOLD_CONFIRM_RUNS && !alreadyHeld) {
          fpState.fixAttempts.push({
            outcome: 'held',
            issueNumber: fpState.issueNumber as number,
            runId: ctx.runId,
            at: ctx.timestamp,
          });
        }
      }
    });
}

// Recounts including tonight's pending recurrence so escalation takes effect on this run.
export function applyRecurrenceCounts(state: TriageState): void {
  const { history, decisions, pendingRecurrences } = state;
  decisions.forEach(decision => {
    const fp = decision.bundle.fingerprint;
    const fpState = history.fingerprints[fp];
    const pending = pendingRecurrences.get(fp);
    decision.bundle.priorFixAttempts =
      attemptsWithOutcome(fpState, 'recurred').length +
      (pending === 'recurred' ? 1 : 0);
    decision.bundle.diagnosticsAttempts =
      attemptsWithOutcome(fpState, 'instrumented').length +
      (pending === 'instrumented' ? 1 : 0);
    if (
      decision.route === 'auto_fix_candidate' &&
      decision.bundle.priorFixAttempts >= ESCALATE_AFTER_ATTEMPTS
    ) {
      decision.route = 'escalate';
      decision.reason = 'repeat_fix_attempts_failed';
    }
  });
}

// Lists the PRs that already failed to fix each recurring fingerprint, so the next session
// starts from what was already tried.
export async function attachPriorPullRequests(
  state: TriageState
): Promise<void> {
  const { history, gh, decisions } = state;
  if (!gh) return;
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

// ---------- 5. prune, summarize ----------

// Drops state that has stopped reporting, unless a fingerprint still has an open issue.
export function pruneHistory(history: HistoryStore): void {
  const cutoff = Date.now() - PRUNE_AFTER_DAYS * 86400_000;
  Object.entries(history.fingerprints).forEach(([fp, fpState]) => {
    const lastSeen = Date.parse(fpState.lastSeenAt ?? '') || 0;
    if (lastSeen < cutoff && fpState.issueState !== 'open') {
      delete history.fingerprints[fp];
    }
  });

  // Deleted or renamed tests would otherwise keep their entries in the cache forever, since
  // nothing ever appends to them again.
  Object.entries(history.tests).forEach(([testKey, entry]) => {
    const lastRun = Date.parse(entry.runs.at(-1)?.timestamp ?? '') || 0;
    if (lastRun < cutoff) {
      delete history.tests[testKey];
    }
  });

  // Surviving fingerprints accumulate testKeys forever, so drop the ones just pruned above.
  Object.values(history.fingerprints).forEach(fpState => {
    fpState.testKeys = fpState.testKeys?.filter(key => key in history.tests);
  });
}

export function renderSummary({
  counts,
  failing,
  decisions,
  dryRun,
  broadFailureRatio,
}: {
  counts: Record<string, number>;
  failing: FailingTest[];
  decisions: Decision[];
  dryRun: boolean;
  broadFailureRatio: number;
}): string {
  const byRoute = (route: Route): Decision[] =>
    decisions.filter(d => d.route === route);
  const agentEligible = byRoute('auto_fix_candidate').length;
  const agentAssigned = decisions.filter(d => d.assigned === true).length;
  return `${[
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
      ? '- _An agent is only assigned to issues that are new, reopened, or have no assignee; eligible fingerprints already assigned keep the session or human working on them._'
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
    .join('\n')}\n`;
}
