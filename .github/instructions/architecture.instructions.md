---
applyTo:
  - "packages/**/*.{ts,tsx,js,jsx}"
  - "package.json"
  - "tsconfig.json"
  - "lerna.json"
  - "nx.json"
  - ".github/workflows/**/*.yml"
---

# Systems architect review

- Review the PR as a systems architect before reviewing details.
- Check that changes fit the monorepo package boundaries instead of introducing cross-package leakage.
- Preserve the main layering:
  - `golden-layout` -> `dashboard` -> `dashboard-core-plugins` -> app packages
  - `grid` -> `iris-grid`
  - `jsapi-types` / `jsapi-shim` / `jsapi-bootstrap` / `jsapi-components` / `jsapi-utils`
- Flag changes that bypass established extension points such as plugin registration, reducer registration, or existing hooks/contexts.
- Prefer changes that reuse existing workspace packages over duplicating logic in app packages.
- Watch for dependency mistakes that break repository rules, especially direct `@adobe/react-spectrum` imports outside `packages/components/src/spectrum/**` and `packages/components/src/theme/**`.
- Watch for imports of a package's own `@deephaven/<name>` alias from within that same package; relative imports should be used instead.
- For build or workflow changes, check that the required validation order still makes sense: Node 24/npm 11, `npm ci --no-audit`, `npm run build:necessary`, then targeted lint/tests or full build.
- Only raise architecture comments when the issue would make the design harder to extend, harder to reason about, or inconsistent with the existing package model.
