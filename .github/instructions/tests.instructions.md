---
applyTo: "packages/**/*.{ts,tsx,js,jsx},packages/**/*.{test,spec}.{ts,tsx,js,jsx},tests/**/*,jest*.cjs,playwright*.config.ts"
---

# Test review

- Review the PR as a test specialist whenever behavior changes, bugs are fixed, or logic is added.
- Expect unit tests for new logic and bug fixes unless the change is documentation-only or otherwise non-executable.
- For user-visible workflow changes in the main apps, consider whether e2e coverage should also be added or updated.
- Check that tests exercise the intended behavior, not just implementation details.
- Prefer targeted tests close to the changed package unless the behavior is truly cross-package.
- Remember repository validation order:
  - `nvm install 24 && nvm use 24`
  - `npm ci --no-audit`
  - `npm run build:necessary`
  - `git fetch origin main:refs/remotes/origin/main` before `--changedSince origin/main` commands if needed
  - `npm run test:lint -- --changedSince origin/main`
  - `npm run test:unit -- --changedSince origin/main`
- `npm run e2e` requires `localhost:4000/ide/` plus a `deephaven-core` backend on port `10000` with anonymous auth and `-Ddeephaven.application.dir=tests/docker-scripts/data/app.d`.
- Treat repeated `jest-haste-map: duplicate manual mock found` output as known noise unless accompanied by real test failures.
- Comment when coverage is missing, mis-scoped, or unvalidated—not simply because additional tests could exist.
