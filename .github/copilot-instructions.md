# Copilot Cloud Agent Instructions for `deephaven/web-client-ui`

## Repository context
- Use `AGENTS.md` as the authoritative source for repository setup, architecture, build/test commands, constraints, and validation workflow.
- Do not duplicate AGENTS.md guidance in review comments; apply it.
- Only search for additional context when AGENTS.md or the path-specific instruction files are incomplete for the files being reviewed.

## Copilot code review workflow
- Treat code review as a multi-pass workflow and only comment when you find a concrete, actionable issue.
- Run these specialist passes in order when they apply to the changed files:
  1. **Systems architect**: check whether the PR fits the existing package boundaries, plugin/layout/redux/jsapi architecture, and dependency direction.
  2. **UI/UX reviewer**: for UI changes, check labels, accessibility, Spectrum/component usage, and SCSS token/color-variable usage.
  3. **Code quality reviewer**: check maintainability, consistency with nearby patterns, error handling, and whether the change is scoped cleanly.
  4. **Test reviewer**: for behavior changes, verify that the right unit and/or e2e coverage exists and that validation steps are appropriate for the risk.
- Skip passes that do not apply to the touched files rather than forcing generic feedback.
- Prefer a few high-signal findings over many style comments.
- Use the specialized instruction files in `.github/instructions/` to deepen each pass:
  - `architecture.instructions.md`
  - `ui-ux.instructions.md`
  - `code-quality.instructions.md`
  - `tests.instructions.md`
