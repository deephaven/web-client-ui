---
applyTo: '**/*.spec.ts,**/*.spec.js,playwright*.config.*,playwright/**,tests/**'
---

# Playwright rules

Use Playwright's locator/action auto-waiting.

Do not use page.waitForTimeout().

Do not increase retries to resolve a failure.

Do not weaken assertions.

Prefer deterministic application state over time-based synchronization.

Any modification to retry, timeout, worker, or parallelism configuration
must explain the underlying failure mode and why the configuration change
is correct.

# Fixing flaky Playwright tests

The rest of this file applies whenever you are assigned an issue labeled
`auto-investigate` (these also carry `e2e-failure` plus a classification
label: `chronic-flake`, `new-flake`, `persistent-failure`, or
`new-hard-failure`). These issues are opened by the nightly triage pipeline in
`tests/nightly-flake-triage.ts`, not by a person, and embed a context bundle:
the error, stack trace, flake rate over the last `historyWindow` nightly runs,
every other test sharing the same `fingerprint`, links to trace/screenshot
artifacts, and how many prior automated fix attempts recurred. Read all of it
before writing code — the flake rate, classification, and prior-attempt count
change what a correct fix looks like.

## Banned moves

These make a failure stop showing up without fixing anything. Do not use them
as the fix, even temporarily, even if they make the suite green:

- Adding or increasing `waitForTimeout`, `page.waitForTimeout`, or any manual
  `sleep`/`setTimeout` delay
- Raising `retries` or `timeout` in `playwright.config.*` or on an individual
  test
- Loosening an assertion (`toBe` → `toBeTruthy`/`toBeDefined`, adding
  `.soft()`, widening a numeric tolerance) unless the previous assertion was
  provably wrong on its own terms, independent of this failure
- Wrapping the failure in `try`/`catch` so it no longer throws
- Quarantining the test — `test.skip()`/`test.fixme()` is never the answer to a
  flake. A skipped test stops producing runs, so its flake history stops
  accumulating and the evidence needed to diagnose it is lost for good. The
  goal is a fixed flake, not a quiet suite; we would rather keep seeing a
  failure than stop being able to explain it.

  The one legitimate use is a _conditional_ skip for a known platform
  limitation, with the condition and reason stated — as in
  `tests/command-history.spec.ts`, which skips only under Playwright's webkit
  build and says why. That is a permanent environment guard, not a flake
  quarantine.

## Required approach

- Prefer Playwright's web-first, auto-retrying assertions
  (`await expect(locator).toBeVisible()`, `toHaveText()`, etc.) over any
  manual wait. If the test isn't already using them, that's frequently the
  actual fix.
- Fix the root cause named in the context bundle: a race condition, a brittle
  selector, shared test-data collision, incorrect setup/teardown ordering, or
  a real application bug the test correctly caught.
- A `persistent-failure` or `new-hard-failure` classification means the test
  failed on every retry, not intermittently — treat it as a likely regression
  and diagnose why it now fails every time instead of adding resilience
  around it.
- If more than one test is listed under the same `fingerprint`, fix the shared
  root cause once (usually in a shared page object, fixture, or helper) rather
  than patching each spec separately.
- If the root cause is in application code, say so explicitly and either fix
  it or open a separate application-bug issue — don't adjust the test to
  tolerate broken behavior.

## When you cannot find the root cause

Do not guess, and do not quarantine. Make the _next_ occurrence diagnosable
instead:

1. Add the instrumentation that would have told you what went wrong — attach
   application state, the relevant log history, or failed network requests via
   `testInfo.attach()` so it lands in the report the triage pipeline reads.
   Prefer application-level state over browser console or network noise, which
   the Playwright trace already captures.
2. Label the issue `diagnostics-added`. The triage pipeline reads that label
   and records the next recurrence as a diagnostics round rather than a failed
   fix, so it does not count toward the two attempts before escalation.
3. Open the PR with the instrumentation and a written handoff: what you ruled
   out and how, what hypotheses remain, and exactly what the next session
   should look for in the new output.

The flake recurring after this is the expected outcome, not a failure. The
next session gets the issue back with your diagnostics attached.

Instrumentation must be additive. Do not change which assertion fails or how
it fails — that changes the error fingerprint, which opens a new issue and
discards the accumulated history for this one.

If the test is failing because of an intentional, recent product change it
hasn't caught up with yet, that is not a flake: update the test to match the
intended behavior and say in the PR what changed and why you're confident the
new behavior is intended.

## Required evidence in the PR description

```
## Root cause
<what was actually wrong, referencing the context bundle's fingerprint/error.
If you could not establish one, say so plainly and fill in Handoff below
instead of Fix.>

## Fix
<what changed and why this addresses the root cause, not the symptom>

## Handoff (diagnostics-only PRs)
<what you ruled out and how; what hypotheses remain; what the next session
should look for in the new output. Confirm the issue is labeled
`diagnostics-added`.>

## Evidence
Ran the affected test(s) N times before and after the fix:
- Before: <pass/fail counts>
- After: <pass/fail counts>

## Scope
<files touched — limited to the failing spec, its fixtures/page objects, and
(if applicable) the application code causing the failure>
```

Re-run the changed test at least 10 times as part of preparing the PR
(`npx playwright test path/to/spec.ts --repeat-each=10`) and report
before/after counts honestly, including if the fix didn't fully resolve it.
That command needs the app on `localhost:4000/ide/` and a core server on
`:10000`; if you don't have both, use the self-contained `npm run e2e:docker`
instead.

## When to stop and escalate

The triage pipeline routes a fingerprint to a human once it has recurred after
2 automated fix attempts, so you won't be assigned those. Diagnostics rounds
don't count toward that total, so adding instrumentation is always preferable
to a speculative fix. Within a single assignment, if your first attempt's
evidence run still shows failures, it's fine to try once more. If a second
attempt still doesn't hold, stop, add the diagnostics that would narrow it
next time, and comment explaining what you tried, why it didn't work, and what
you'd want a human to weigh in on.

## Scope constraints

Touch only the failing spec, the fixtures/page objects/helpers it uses, and —
only when the root cause is there — the specific application code responsible.
Don't refactor unrelated tests, don't change CI configuration beyond what's
needed for this fix, and don't modify branch protection, required checks, or
this policy.
