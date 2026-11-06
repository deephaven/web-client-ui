/* eslint-disable no-console, no-param-reassign */
import type {
  Decision,
  FingerprintState,
  GithubClient,
  TriageState,
} from './triageTypes.ts';
import {
  COPILOT_CUSTOM_AGENT,
  MAX_AGENT_ASSIGNMENTS_PER_RUN,
} from './triageConfig.ts';
import { fingerprintState } from './history.ts';
import { buildIssueBody, buildTitle, labelsFor } from './issues.ts';

type Rendered = NonNullable<Decision['rendered']>;

// Counts assignment attempts, not eligible fingerprints, so issues that already have an
// assignee don't use up the cap.
interface AssignmentBudget {
  attempts: number;
}

// Records the outcome of a recurrence once its issue has actually been reopened.
function recordRecurrence(
  state: TriageState,
  fpState: FingerprintState,
  fp: string,
  issueNumber: number
): void {
  const { ctx, pendingRecurrences, diagnosticsPrByFp } = state;
  const outcome = pendingRecurrences.get(fp);
  if (outcome === undefined) return;
  fpState.fixAttempts.push({
    outcome,
    issueNumber,
    runId: ctx.runId,
    at: ctx.timestamp,
  });
  const diagnosticsPr = diagnosticsPrByFp.get(fp);
  if (outcome === 'instrumented' && diagnosticsPr !== undefined) {
    fpState.consumedDiagnosticsPrs = [
      ...(fpState.consumedDiagnosticsPrs ?? []),
      diagnosticsPr,
    ];
  }
}

// Creates, updates or reopens the issue; returns whether the agent should be assigned.
async function upsertIssue(
  state: TriageState,
  gh: GithubClient,
  decision: Decision,
  rendered: Rendered,
  issueNumber: number | undefined,
  listedState: 'open' | 'closed' | undefined
): Promise<boolean> {
  const { ctx } = state;
  const fp = decision.bundle.fingerprint;
  const fpState = fingerprintState(state.history, fp);
  const wantsAgent = decision.route === 'auto_fix_candidate';

  try {
    if (issueNumber !== undefined) {
      // Fall back to the freshly listed state when the cache has no record of this issue.
      const reopening = (fpState.issueState ?? listedState) === 'closed';
      // Clearing the assignee on reopen is what lets a new session start later, even if this
      // run can't assign (cap reached or no token).
      const updated = await gh.updateIssue(issueNumber, {
        body: rendered.body,
        labels: rendered.labels,
        ...(reopening ? { state: 'open', assignees: [] } : {}),
      });
      if (reopening) recordRecurrence(state, fpState, fp, issueNumber);
      await gh.comment(
        issueNumber,
        reopening
          ? `Recurred after this issue was closed — run ${ctx.runUrl}. Reopening; the previous fix did not hold. The earlier pull request is left closed — this gets a fresh investigation rather than a reopened branch.`
          : `Still failing — run ${ctx.runUrl}.`
      );
      fpState.issueState = 'open';
      fpState.issueNumber = issueNumber;
      decision.issue = issueNumber;
      console.log(
        `  [${decision.route}] ${fp} -> ${
          reopening ? 'reopened' : 'updated'
        } #${issueNumber}`
      );
      // An assigned issue already has a session or a human on it.
      return wantsAgent && (updated?.assignees ?? []).length === 0;
    }

    const created = await gh.createIssue({
      title: rendered.title,
      body: rendered.body,
      labels: rendered.labels,
    });
    fpState.issueNumber = created.number;
    fpState.issueState = 'open';
    fpState.openedAt = ctx.timestamp;
    decision.issue = created.number;
    console.log(`  [${decision.route}] ${fp} -> opened #${created.number}`);
    return wantsAgent;
  } catch (err) {
    console.error(`Failed to sync issue for ${fp}: ${(err as Error).message}`);
    decision.issueError = (err as Error).message;
    return false;
  }
}

async function maybeAssignAgent(
  gh: GithubClient,
  decision: Decision,
  issueNumber: number,
  budget: AssignmentBudget
): Promise<void> {
  const fp = decision.bundle.fingerprint;
  const { assignAgent } = gh;
  if (assignAgent === null) {
    console.log(
      `  [${decision.route}] ${fp} -> #${issueNumber} not assigned (COPILOT_ASSIGN_TOKEN unset)`
    );
    return;
  }
  if (budget.attempts >= MAX_AGENT_ASSIGNMENTS_PER_RUN) {
    console.log(
      `  [${decision.route}] ${fp} -> #${issueNumber} not assigned (cap of ${MAX_AGENT_ASSIGNMENTS_PER_RUN} reached; retried next recurrence)`
    );
    return;
  }
  budget.attempts += 1;
  try {
    await assignAgent(issueNumber);
    decision.assigned = true;
    console.log(
      `  [${decision.route}] ${fp} -> assigned ${COPILOT_CUSTOM_AGENT} to #${issueNumber}`
    );
  } catch (err) {
    console.error(
      `Failed to assign agent for ${fp}: ${(err as Error).message}`
    );
    decision.assignError = (err as Error).message;
  }
}

// Dry run: reports what would happen without touching GitHub.
function previewSync(
  decision: Decision,
  issueNumber: number | undefined,
  budget: AssignmentBudget
): void {
  const wouldAssign =
    decision.route === 'auto_fix_candidate' &&
    budget.attempts < MAX_AGENT_ASSIGNMENTS_PER_RUN;
  if (wouldAssign) budget.attempts += 1;
  console.log(
    `  [${decision.route}] ${decision.bundle.fingerprint} (${
      decision.reason
    }) - would ${
      issueNumber !== undefined ? `update #${issueNumber}` : 'open an issue'
    }${wouldAssign ? ' and assign the agent' : ''}`
  );
  decision.issue = issueNumber ?? null;
  decision.assigned = wouldAssign;
}

async function syncIssue(
  state: TriageState,
  decision: Decision,
  budget: AssignmentBudget
): Promise<void> {
  const { history, ctx, gh, existingByFingerprint } = state;
  const fp = decision.bundle.fingerprint;
  const fpState = fingerprintState(history, fp);
  fpState.lastSeenAt = ctx.timestamp;
  fpState.lastSeenRunId = ctx.runId;

  if (decision.route === 'no_action') {
    console.log(`  [no_action] ${fp} (${decision.reason})`);
    return;
  }

  const listed = existingByFingerprint.get(fp);
  const issueNumber = fpState.issueNumber ?? listed?.number;
  // Keep the rendered issue on the decision so a dry run is reviewable.
  const rendered: Rendered = {
    title: buildTitle(decision.bundle),
    labels: labelsFor(decision),
    body: buildIssueBody(decision, ctx),
  };
  decision.rendered = rendered;

  if (gh === null) {
    previewSync(decision, issueNumber, budget);
    return;
  }

  const shouldAssign = await upsertIssue(
    state,
    gh,
    decision,
    rendered,
    issueNumber,
    listed?.state
  );
  if (shouldAssign && decision.issue != null) {
    await maybeAssignAgent(gh, decision, decision.issue, budget);
  }
}

// Opens or updates one issue per fingerprint, assigning agents in priority order.
async function syncIssues(state: TriageState): Promise<void> {
  // Agent candidates first, worst track record first, so the cap spends its budget on them;
  // ties break toward the fingerprint affecting more tests. escalate/no_action routes never
  // get an agent.
  state.decisions.sort(
    (a, b) =>
      Number(b.route === 'auto_fix_candidate') -
        Number(a.route === 'auto_fix_candidate') ||
      b.bundle.flakeRate - a.bundle.flakeRate ||
      b.bundle.tests.length - a.bundle.tests.length
  );
  const budget: AssignmentBudget = { attempts: 0 };

  // Sequential, not Promise.all, to avoid racing GitHub issue creation/updates for
  // fingerprints that resolve to the same issue.
  await state.decisions.reduce(async (prev, decision) => {
    await prev;
    await syncIssue(state, decision, budget);
  }, Promise.resolve());
}

export default syncIssues;
