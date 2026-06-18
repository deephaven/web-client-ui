# Copilot Cloud Agent Instructions for `deephaven/web-client-ui`

## Start here
- This is a Lerna + npm workspaces monorepo (`packages/*`) with Node.js **24.x** and npm **11.x** required.
- Before doing anything else:
  1. `nvm install 24 && nvm use 24`
  2. `npm ci --no-audit`
- Core apps: `packages/code-studio`, `packages/embed-widget`, `packages/embed-chart`, `packages/embed-grid`.

## High-signal workflow for most tasks
1. Build generated prerequisites first: `npm run build:necessary` (builds `@deephaven/icons`).
2. Run targeted checks first when possible:
   - Lint (changed files): `npm run test:lint -- --changedSince origin/main`
   - Unit tests (changed files): `npm run test:unit -- --changedSince origin/main`
3. If task scope is broad, run full build: `npm run build`.

## Important repository constraints
- Do not import `@adobe/react-spectrum` outside `packages/components/src/spectrum/**` and `packages/components/src/theme/**`.
- Inside a package, do not import that same package via its own `@deephaven/<name>` alias; use relative imports.
- PR titles are enforced as Conventional Commits (`feat`, `fix`, `docs`, `chore`, etc.).

## Copilot code review workflow
- Treat code review as a multi-pass workflow and only comment when you find a concrete, actionable issue.
- Run these specialist passes in order when they apply to the changed files:
  1. **Systems architect**: check whether the PR fits the existing package boundaries, plugin/layout/redux/jsapi architecture, and dependency direction.
  2. **UI/UX reviewer**: for UI changes, check labels, accessibility, Spectrum/component usage, and SCSS token/color-variable usage.
  3. **Code quality reviewer**: check maintainability, consistency with nearby patterns, error handling, and whether the change is scoped cleanly.
  4. **Test reviewer**: for behavior changes, verify that the right unit and/or e2e coverage exists and that validation steps are appropriate for the risk.
- Skip passes that do not apply to the touched files rather than forcing generic feedback.
- Prefer a few high-signal findings over many style comments.

## Known pitfalls and workarounds (encountered)
- **Error:** `npm ci` fails with `EBADENGINE` (`Required: node >=24, npm >=11`).
  - **Workaround:** switch toolchain first: `nvm install 24 && nvm use 24`.
- **Error:** lint reports `import/no-unresolved` for `@deephaven/icons`.
  - **Workaround:** run `npm run build:necessary` before lint/tests.
- **Error:** `fatal: bad revision 'origin/main...HEAD'` when using `--changedSince origin/main`.
  - **Workaround:** fetch the branch first: `git fetch origin main:refs/remotes/origin/main`.
- **Noise:** repeated `jest-haste-map: duplicate manual mock found` warnings across packages.
  - **Workaround:** expected in this monorepo; continue unless accompanied by actual failing suites.

## Local run and test context
- Dev servers: `npm start` (code-studio on `:4000`, embed-widget on `:4010`).
- Web UI needs a running `deephaven-core` backend (default `http://localhost:10000`).
- If backend host/port differs, set `VITE_PROXY_URL` in package `.env.local` files.

## E2E notes
- `npm run e2e` requires UI at `localhost:4000/ide/` and `deephaven-core` on port `10000` with anonymous auth plus `tests/docker-scripts/data/app.d` application directory.
- Run `npx playwright install` before first local e2e run.
- For CI-like e2e behavior and snapshot updates, use Docker scripts (`npm run e2e:docker`, `npm run e2e:update-ci-snapshots`).
