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
  mkdirSync,
  appendFileSync,
} from 'node:fs';
import path from 'node:path';
import type {
  CliArgs,
  PlaywrightSuite,
  RunContext,
  FailingTest,
  Decision,
  FailingStatus,
  FixOutcome,
  Route,
} from './triageTypes';
import {
  BASE_LABEL,
  BROAD_FAILURE_RATIO,
  COPILOT_ASSIGN_TOKEN,
  COPILOT_CUSTOM_AGENT,
  DIAGNOSTICS_LABEL,
  DIAGNOSTICS_ROUND_PATTERN,
  ESCALATE_AFTER_ATTEMPTS,
  HOLD_CONFIRM_RUNS,
  MAX_AGENT_ASSIGNMENTS_PER_RUN,
  MAX_ISSUE_STATE_REFRESHES,
  PRUNE_AFTER_DAYS,
} from './triageConfig';
import { extractErrorContext, fingerprint, stripAnsi } from './fingerprinting';
import {
  groupStats,
  recordRun,
  loadHistory,
  saveHistory,
  fingerprintState,
  attemptsWithOutcome,
} from './history';
import { classify, decide } from './decision';
import { buildIssueBody, buildTitle, labelsFor } from './issues';
import { makeClient } from './githubApi';

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
        child.title !== undefined ? [...titlePath, child.title] : titlePath
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
  // The per-issue refresh below is capped, so take open/closed state from this listing first;
  // otherwise an issue skipped by the cap keeps a stale cached state through recurrence accounting.
  Object.entries(history.fingerprints).forEach(([fp, state]) => {
    const listed = existingByFingerprint.get(fp);
    if (listed === undefined) return;
    state.issueNumber ??= listed.number;
    if (state.issueNumber === listed.number) state.issueState = listed.state;
  });
  // Fingerprints whose closing round only added diagnostics, per the merged PR's declaration or
  // a manually applied label.
  const diagnosticsOnly = new Set<string>();
  // The merged diagnostics PR behind each fingerprint's exemption, consumed once it is reopened.
  const diagnosticsPrByFp = new Map<string, string>();
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
            const latest = merged[0];
            if (
              latest !== undefined &&
              DIAGNOSTICS_ROUND_PATTERN.test(latest.body) &&
              !(state.consumedDiagnosticsPrs ?? []).includes(latest.url)
            ) {
              diagnosticsOnly.add(fp);
              diagnosticsPrByFp.set(fp, latest.url);
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
  // A recurrence is only recorded once the issue is actually reopened (step 4), otherwise a
  // suppressed or failed reopen would count the same closure again on a later night.
  const decisionByFp = new Map(decisions.map(d => [d.bundle.fingerprint, d]));
  const pendingRecurrences = new Map<string, FixOutcome>();
  Object.entries(history.fingerprints)
    .filter(
      ([, state]) =>
        state.issueNumber !== undefined && state.issueState === 'closed'
    )
    .forEach(([fp, state]) => {
      if (seenThisRun.has(fp)) {
        state.cleanRunsSinceClose = 0;
        if (decisionByFp.get(fp)?.route === 'no_action') return;
        // A diagnostics-only round expects to recur, so it is recorded apart from real fix
        // attempts and leaves the escalation budget intact.
        pendingRecurrences.set(
          fp,
          diagnosticsOnly.has(fp) ? 'instrumented' : 'recurred'
        );
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

  // Recount including tonight's pending recurrence so escalation takes effect on this run.
  decisions.forEach(decision => {
    const fp = decision.bundle.fingerprint;
    const state = history.fingerprints[fp];
    const pending = pendingRecurrences.get(fp);
    decision.bundle.priorFixAttempts =
      attemptsWithOutcome(state, 'recurred').length +
      (pending === 'recurred' ? 1 : 0);
    decision.bundle.diagnosticsAttempts =
      attemptsWithOutcome(state, 'instrumented').length +
      (pending === 'instrumented' ? 1 : 0);
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

  // Process agent candidates first, worst track record first, so the cap spends its budget on
  // them; ties break toward the fingerprint affecting more tests. escalate/no_action routes
  // never get an agent. The cap counts assignment attempts, not eligible fingerprints, so issues
  // that already have an assignee don't use it up.
  decisions.sort(
    (a, b) =>
      Number(b.route === 'auto_fix_candidate') -
        Number(a.route === 'auto_fix_candidate') ||
      b.bundle.flakeRate - a.bundle.flakeRate ||
      b.bundle.tests.length - a.bundle.tests.length
  );
  let assignmentAttempts = 0;

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
    const wantsAgent = decision.route === 'auto_fix_candidate';

    if (dryRun) {
      const wouldAssign =
        wantsAgent && assignmentAttempts < MAX_AGENT_ASSIGNMENTS_PER_RUN;
      if (wouldAssign) assignmentAttempts += 1;
      console.log(
        `  [${decision.route}] ${fp} (${decision.reason}) - would ${
          issueNumber !== undefined ? `update #${issueNumber}` : 'open an issue'
        }${wouldAssign ? ' and assign the agent' : ''}`
      );
      decision.issue = issueNumber ?? null;
      decision.assigned = wouldAssign;
      return;
    }

    // Only hand the issue to an agent when nobody is on it: a brand-new issue, or an open one
    // with no assignee (reopening clears it, and an earlier assignment may have been skipped or
    // failed). An assigned issue already has a session or a human on it.
    let shouldAssign = false;

    try {
      if (issueNumber !== undefined) {
        // Fall back to the freshly fetched state when the cache has no record of this issue.
        const reopening = (state.issueState ?? known?.state) === 'closed';
        // Clearing the assignee on reopen is what lets a new session start later, even if this
        // run can't assign (cap reached or no token).
        const updated = await gh?.updateIssue(issueNumber, {
          body,
          labels,
          ...(reopening ? { state: 'open', assignees: [] } : {}),
        });
        const outcome = pendingRecurrences.get(fp);
        if (reopening && outcome !== undefined) {
          state.fixAttempts.push({
            outcome,
            issueNumber,
            runId: ctx.runId,
            at: ctx.timestamp,
          });
          const diagnosticsPr = diagnosticsPrByFp.get(fp);
          if (outcome === 'instrumented' && diagnosticsPr !== undefined) {
            state.consumedDiagnosticsPrs = [
              ...(state.consumedDiagnosticsPrs ?? []),
              diagnosticsPr,
            ];
          }
        }
        await gh?.comment(
          issueNumber,
          reopening
            ? `Recurred after this issue was closed — run ${ctx.runUrl}. Reopening; the previous fix did not hold. The earlier pull request is left closed — this gets a fresh investigation rather than a reopened branch.`
            : `Still failing — run ${ctx.runUrl}.`
        );
        state.issueState = 'open';
        state.issueNumber = issueNumber;
        decision.issue = issueNumber;
        shouldAssign = wantsAgent && (updated?.assignees ?? []).length === 0;
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
      } else if (assignmentAttempts >= MAX_AGENT_ASSIGNMENTS_PER_RUN) {
        console.log(
          `  [${decision.route}] ${fp} -> #${decision.issue} not assigned (cap of ${MAX_AGENT_ASSIGNMENTS_PER_RUN} reached; retried next recurrence)`
        );
      } else {
        assignmentAttempts += 1;
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
      .join('\n')}\n`
  );
}

await main();
