# Copilot instructions for deephaven/web-client-ui

`AGENTS.md` at the repository root is the authoritative guide for repository setup, architecture, build/test commands, and the change-validation workflow. Apply that guidance directly; do not restate it in review comments.

Path-scoped review guidance lives in `.github/instructions/*.instructions.md` (architecture, UI/UX, code quality, tests).

## Code review

Comment only on concrete, actionable issues in the changed code. Prefer a few high-signal findings over many minor comments. Do not comment on formatting, import ordering, or naming style — Prettier, ESLint, and Stylelint already enforce those in CI.

The highest-value issues to flag in this repository:

- Direct `@adobe/react-spectrum` imports anywhere outside `packages/components/src/spectrum/` and `packages/components/src/theme/`. All other code must use the re-exports from `@deephaven/components`.
- A package importing its own `@deephaven/<name>` alias; within a package, imports must be relative.
- Violations of the package layering: `golden-layout` → `dashboard` → `dashboard-core-plugins` → app packages, and `grid` → `iris-grid`. Dependencies must not point backwards, and app-only logic must not land in library packages.
- Logic duplicated from an existing hook, utility, or component in a workspace package instead of reusing it.
- New behavior or bug fixes with no unit tests, and user-visible workflow changes with no e2e coverage consideration.
- Missing cleanup for async operations, event listeners, or JS API subscriptions (memory leaks and stale-state bugs).
- Hard-coded colors, spacing, or typography in SCSS where an existing design token or variable exists.
- Accessibility regressions: interactive elements that are unlabeled, unreachable by keyboard, or that convey state through color alone.

PR titles must follow Conventional Commits (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`). Breaking changes are declared with a `BREAKING CHANGE:` footer in the PR description — the `!` shorthand is not allowed.
