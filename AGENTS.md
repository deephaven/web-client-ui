# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

Lerna + npm workspaces monorepo with ~38 packages under `packages/*`. Nx is used only for build caching (see `nx.json`). Node 24 / npm 11 (`.nvmrc`). Most packages are libraries built with Babel + Sass; the four apps (`code-studio`, `embed-widget`, `embed-chart`, `embed-grid`) are built with Vite.

The web UI does not work standalone — it requires a `deephaven-core` server on port 10000 (override with `VITE_PROXY_URL` in `packages/<app>/.env.local`). For E2E, core must run with anonymous auth and `-Ddeephaven.application.dir=tests/docker-scripts/data/app.d` (see README's E2E section).

## Common commands

- `npm start` — build icons, then watch types and start dev servers (`code-studio` on :4000, `embed-widget` on :4010).
- `npm run start:app` / `npm run start:embed-widget` — start a single dev server.
- `npm run build` — full prod build: `build:necessary` → `types` → `build:packages` → `build:apps`. Always builds `@deephaven/icons` first because it generates SVGs other packages consume.
- `npm run types` / `npm run watch:types` — `tsc --build` using project references. Top-level packages must be listed in the root `tsconfig.json` references for type emit to work.
- `npm test` — Jest watch mode, filtered to files changed since `origin/main`. Press `p` to filter by name, `Shift+P` to toggle the `eslint`/`stylelint` jest projects.
- `npm run test:unit` — runs `build:necessary`, then all unit tests across every package's `jest.config.cjs`.
- `npm run test:lint` — runs ESLint and Stylelint as jest projects via `jest-runner-eslint` / `jest-runner-stylelint`. Faster than `lint:packages` when narrowed (`-- --changedSince origin/main`).
- Single test: `npm run test:unit -- <pattern>` (matches filename or test name), or `npm run test:debug <pattern>` to attach a debugger.
- `npm run e2e` / `npm run e2e:headed` — Playwright; requires `localhost:4000/ide/` reachable and core running. `npm run e2e:docker` builds a prod image and runs everything in docker. Snapshots are Linux-only — update CI snapshots with `npm run e2e:update-ci-snapshots`.
- `DH_LOG_LEVEL=4 npm test` — enable `@deephaven/log` output in tests (suppressed by default in `jest.setup.ts`).

## Architecture

- **App entry points** all live in `packages/code-studio` (main UI), `packages/embed-widget` (single-widget embed), `packages/embed-chart`, `packages/embed-grid`. `code-studio` depends on nearly every other package and is the fastest way to see end-to-end effects.
- **Rendering / layout stack:** `golden-layout` (low-level panel framework) → `dashboard` (panel state + APIs) → `dashboard-core-plugins` (concrete panel types: chart, grid, console, filter, linker) → `code-studio` wires plugins into the app shell. Plugins are registered via `@deephaven/plugin`.
- **Data grids:** `grid` is a generic high-performance canvas grid; `iris-grid` is the Deephaven-aware grid that knows about the JS API (filters, totals rows, snapshots, etc.). `iris-grid` depends on `grid`.
- **JS API integration:** `jsapi-types` (TypeScript types for the API delivered by core), `jsapi-shim` (re-exports the runtime API loaded from core), `jsapi-bootstrap` (React context + hooks like `useApi`, `useObjectFetcher`, `useWidget` that gate UI on API readiness), `jsapi-components` (React components that consume the API), `jsapi-utils` (framework-free helpers), `jsapi-nodejs` (Node loader for using the API server-side).
- **State:** `redux` package owns the root store, reducer registry, middleware, and selectors. Other packages register reducers via `reducerRegistry`. `react-hooks` and `jsapi-bootstrap` provide React-side primitives.
- **UI primitives:** `components` is the design system. It re-exports a curated subset of `@adobe/react-spectrum` from `components/src/spectrum` — the rest of the codebase **must not** import `@adobe/react-spectrum` directly (enforced by `no-restricted-imports` in the root ESLint config). Inside `components`, only `src/spectrum/**` and `src/theme/**` may import the spectrum package.
- **No self-imports:** the same ESLint rule forbids a package from importing its own `@deephaven/<name>` alias — use relative paths within a package.

## Test wiring

- Unit tests resolve workspace packages from source via Jest `moduleNameMapper` (`^@deephaven/(?!icons|jsapi-types)(.*)$ → packages/$1/src`), so you don't need to rebuild dependencies between edits. `icons` and `jsapi-types` are exceptions and ship pre-built.
- Each package has a thin `jest.config.cjs` that extends `jest.config.base.cjs`. Tests run under `jsdom` with `jest.setup.ts` mocking `matchMedia`, `ResizeObserver`, `IntersectionObserver`, fonts, etc.
- The "dh-core" JS API is mocked globally via `__mocks__/dh-core` — most tests that touch the API use `@deephaven/test-utils` helpers and the mock proxy pattern (`TestUtils.createMockProxy<T>()`).

## Conventions

- **Conventional Commits are required for PR titles** (enforced by `conventional-pr-check.yml`). Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Breaking changes use a `BREAKING CHANGE:` footer in the PR description — **do not** use the `!` shorthand.
- Lerna versioning is conventional-commits driven; release notes and CHANGELOGs are generated automatically.
- ESLint extends Airbnb + React; Prettier and Stylelint are wired through `@deephaven/prettier-config` and `@deephaven/stylelint-config`. Run `npm run test:lint` rather than calling eslint/stylelint directly so caching works.
- New packages: copy `embed-widget` for an app, `components` for a library, then add to root `tsconfig.json` references if it needs to participate in `npm run types`.
