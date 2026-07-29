---
applyTo: "packages/**/*.ts,packages/**/*.tsx,packages/**/*.js,packages/**/*.jsx,tests/**,jest*.cjs,playwright*.ts"
---

# Test review

- Expect unit tests for new logic and bug fixes; a bug fix should include a test that fails without the fix. Documentation-only or otherwise non-executable changes are exempt.
- For user-visible workflow changes in the apps (`code-studio`, `embed-*`), check whether Playwright e2e coverage in `tests/` should be added or updated.
- Tests must exercise observable behavior, not implementation details; flag tests that assert on internals (private state, mock call counts as the primary assertion) when a behavioral assertion is available.
- Prefer targeted tests in the changed package; cross-package tests only when the behavior genuinely spans packages.
- Unit tests resolve workspace packages from source via Jest `moduleNameMapper` and mock the JS API via `__mocks__/dh-core.js`; new tests touching the API should use `@deephaven/test-utils` helpers (e.g. `TestUtils.createMockProxy<T>()`) rather than ad-hoc mocks.
- Flag snapshot tests used where a specific assertion would be clearer or less brittle.
- The commands and environment for running tests locally (including e2e prerequisites) are documented in `AGENTS.md` under "Validating changes" — hold PRs to that workflow rather than restating it.
- Comment when coverage is missing, mis-scoped, or asserts the wrong thing — not merely because additional tests could exist.
