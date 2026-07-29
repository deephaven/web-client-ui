---
applyTo: "packages/**,package.json,tsconfig.json,lerna.json,nx.json,.github/workflows/**"
---

# Architecture review

- Flag changes that cross monorepo package boundaries instead of going through the package's public API.
- Preserve the dependency layering; flag anything that points backwards:
  - `golden-layout` → `dashboard` → `dashboard-core-plugins` → app packages (`code-studio`, `embed-widget`, `embed-chart`, `embed-grid`)
  - `grid` → `iris-grid`
  - `jsapi-types` / `jsapi-shim` / `jsapi-bootstrap` / `jsapi-components` / `jsapi-utils`
- Flag changes that bypass established extension points: plugin registration via `@deephaven/plugin`, reducer registration via `reducerRegistry`, and existing hooks/contexts in `jsapi-bootstrap` and `react-hooks`.
- Flag logic added to an app package (`code-studio`, `embed-*`) that duplicates or belongs in an existing library package.
- Flag direct `@adobe/react-spectrum` imports outside `packages/components/src/spectrum/` and `packages/components/src/theme/` — everything else must import through `@deephaven/components`.
- Flag a package importing its own `@deephaven/<name>` alias; within a package, imports must be relative.
- New top-level packages that participate in type builds must be added to the root `tsconfig.json` references; flag new packages that miss this.
- For build or CI workflow changes, check the validation order in `AGENTS.md` still holds: Node 24 / npm 11, `npm ci --no-audit`, `npm run build:necessary` before any tests or app builds.
- Raise an architecture comment only when the issue makes the design harder to extend, harder to reason about, or inconsistent with the existing package model.
