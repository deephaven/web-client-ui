#!/usr/bin/env node
/* eslint-disable no-console */
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
  TriageState,
} from './triageTypes.ts';
import { loadHistory, saveHistory } from './history.ts';
import makeClient from './githubApi.ts';
import syncIssues from './issueSync.ts';
import {
  applyRecurrenceCounts,
  attachPriorPullRequests,
  buildDecisions,
  fetchExistingIssues,
  judgePreviousFixes,
  pruneHistory,
  reconcileIssueState,
  renderSummary,
  walkReport,
} from './triageSteps.ts';

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

  // 1. walk the merged report
  const { failing, counts } = walkReport(report, history, ctx);

  // If a large fraction of the suite failed at once, it's more likely infra than any one flake.
  const broadFailureRatio =
    counts.total > 0 ? failing.length / counts.total : 0;
  console.log(
    `${counts.total} test(s) ran: ${counts.expected ?? 0} passed, ${
      counts.flaky ?? 0
    } flaky, ${counts.unexpected ?? 0} failed.`
  );

  // 2. group by fingerprint and decide
  const decisions = buildDecisions(failing, history, broadFailureRatio);

  // 3. reconcile tracked issue state, record held/recurred outcomes
  const state: TriageState = {
    history,
    ctx,
    gh,
    decisions,
    seenThisRun: new Set(decisions.map(d => d.bundle.fingerprint)),
    existingByFingerprint: gh ? await fetchExistingIssues(gh) : new Map(),
    diagnosticsOnly: new Set(),
    diagnosticsPrByFp: new Map(),
    pendingRecurrences: new Map(),
  };
  await reconcileIssueState(state);
  judgePreviousFixes(state);
  applyRecurrenceCounts(state);
  await attachPriorPullRequests(state);

  // 4. open or update one issue per fingerprint
  await syncIssues(state);

  // 5. prune, persist, summarize
  pruneHistory(history);
  saveHistory(historyPath, history);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify({ ...ctx, counts, broadFailureRatio, decisions }, null, 2)
  );
  writeSummary(
    renderSummary({ counts, failing, decisions, dryRun, broadFailureRatio })
  );
}

await main();
