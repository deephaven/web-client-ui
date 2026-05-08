# DH-22326 Keep hidden columns hidden after applying a rollup

In IrisGrid, columns hidden via the column-visibility menu used to reappear
when a rollup was applied or removed. This plan preserves hidden-column state
across rollup changes while un-hiding the group-by columns.

## Team(s)

### Primary team

- **UI Team** — isolated to `web-client-ui` (`@deephaven/iris-grid`).

### Cross-team dependencies

None. Builds on PR [#2670](https://github.com/deephaven/web-client-ui/pull/2670)
("Persist user column widths by name in IrisGrid"), which made
`IrisGridMetricCalculator` track user column widths by **name** alongside the
legacy by-`ModelIndex` map.

## Problem / Feature Gap

`IrisGrid.handleRollupChange()` called `showAllColumns()`, clearing all
hidden-column state. After the rollup model rebuilt, previously-hidden
columns came back visible — same on rollup removal. Users had to re-hide
columns on every rollup change.

`handleRollupChange` was conflating two concerns:

1. Group-by columns must not be hidden (a width-0 group-by is meaningless).
2. **All other** hidden columns should keep their width-0 state across the
   model swap.

`showAllColumns()` handled (1) by clearing every entry in `userColumnWidths`,
losing (2).

## Scope

### In Scope / Requirements

- Apply rollup → hidden group-by columns are un-hidden; group-by columns the
  user has manually resized keep their width; other hidden columns stay hidden.
- Remove rollup → columns hidden before the rollup stay hidden on the base
  table.
- Editing an existing rollup → a newly-added group-by column absent from the
  current (rolled-up) model is still un-hidden when it reappears.
- No change to persisted grid state shape.

### Out of Scope / Limitations

- Other `showAllColumns()` callers (`selectDistinct`, custom-column changes,
  context menu) are unchanged.
- No new cross-session persistence beyond what PR #2670 added (by-name
  hidden state).

### Risks

- The by-index cleanup in `resetColumnWidthByName` only fires when the column
  is in the calculator's `cachedModelColumnNames`. Otherwise the by-index map
  may briefly hold a stale entry, reconciled on the next `getMetrics()` pass
  via `updateColumnWidthsIfNecessary`.

## Technical Design

### Decisions

- **Un-hide only the hidden group-by columns.** In `handleRollupChange`,
  filter `rollupConfig.columns` down to those whose by-name stored width is
  `0` before calling `metricCalculator.resetColumnWidthByName(name)`. Group-by
  columns the user has manually resized keep their width. The filter lives at
  the call site; `resetColumnWidthByName` stays general-purpose.
- **Reset by name, not by index.** When editing a rollup, the current model is
  the rolled-up one and may not contain a newly-added group-by column; an
  index lookup against `this.props.model` would miss it.
- **Keep `showAllColumns()`.** Other callers (`handleClearAllFilters`,
  context menu's "Show All Columns") still use it; only the rollup call site
  changes.
- **Symmetric apply/remove.** Rollup removal flows through the same handler
  with `rollupConfig.columns` empty; the new code short-circuits, and by-name
  hidden state survives the model rebuild via PR #2670.

### Development Plan

See PR [#2668](https://github.com/deephaven/web-client-ui/pull/2668) for the
implementation.

### Delivery Plan

- **Target**: `deephaven/web-client-ui`, `@deephaven/iris-grid`. Bug fix; only
  API addition is the new public method on `IrisGridMetricCalculator`.
- **Versioning**: next routine `web-client-ui` release; picked up by `iris`
  via the standard bump.
- **Risk**: low. Additive behavior change (previously-cleared state is now
  retained). No state migration.
- **Documentation**: changelog entry under `iris-grid` ("Hidden columns are
  preserved when applying or removing a rollup; only group-by columns are
  un-hidden.").
- **Acceptance criteria / test plan**:
  1. Unit tests in [IrisGrid.test.tsx](../packages/iris-grid/src/IrisGrid.test.tsx)
     under `describe('handleRollupChange', ...)`:
     - `'un-hides hidden group-by columns by name'` — seeds width-0 entries
       for the group-by columns; asserts `resetColumnWidthByName` is called
       once per group-by name.
     - `'does not call resetColumnWidthByName when there are no group-by
       columns'` — empty `columns`; covers rollup removal.
     - `'un-hides a group-by column that is absent from the current
       (already rolled-up) model'` — seeds a width-0 by-name entry for a
       column missing from the current model; asserts removal.
     - `'preserves a non-zero user width on a group-by column'` — seeds a
       non-zero width; asserts `resetColumnWidthByName` is NOT called and the
       width is unchanged.
     - `'un-hides only the hidden group-by columns when widths are mixed'` —
       two group-bys (one width 0, one width 250); asserts the spy is called
       exactly once with the hidden name and the sized name keeps its width.
  2. Existing `handleSelectDistinctChanged`, `handleCustomColumnsChanged`,
     and column-visibility tests pass unmodified.
  3. Manual smoke: hide a non-group-by column, apply a rollup → column stays
     hidden; remove the rollup → still hidden.
  4. `npm run test:unit -- iris-grid`, lint, and typecheck pass.

## Research Appendix

### Hidden-column storage (post-PR #2670)

Hidden state lives in `IrisGridMetricCalculator`:

- `userColumnWidthsByName: Map<ColumnName, number>` — source of truth;
  survives model swaps via stable column names.
- `userColumnWidths: Map<ModelIndex, number>` — derived projection rebuilt on
  every `getMetrics()` pass via `updateColumnWidthsIfNecessary`. Consumers
  (rendering, `IrisGridUtils.getHiddenColumns`) read this map.

Before PR #2670 only the by-index map existed, so legacy code had to clear it
on rollup.

### Rollup application flow

1. User triggers rollup → `IrisGrid.handleRollupChange(rollupConfig)`.
2. Handler: per-name resets for the hidden (width-0) entries among
   `rollupConfig.columns`, then `resetGridViewState()`, `clearAllFilters()`,
   `setState({ rollupConfig, … })`.
3. `IrisGridModelUpdater` propagates `rollupConfig` to
   `IrisGridProxyModel.set rollupConfig`, which calls
   `originalModel.table.rollup(rollupConfig)` and swaps the model.
4. New model fires `COLUMNS_CHANGED`. The next `getMetrics()` pass calls
   `updateColumnWidthsIfNecessary`, re-projecting `userColumnWidthsByName`
   onto a fresh `userColumnWidths`. Previously-hidden columns still in the
   model are re-hidden automatically; group-by columns just removed from
   `userColumnWidthsByName` stay visible.

### Why not re-hide via an index lookup at call time?

Fragile: `cachedModelColumnNames` may be stale relative to the *next* model,
and `this.props.model` may not contain the new group-by column. Letting the
next `getMetrics()` pass reconcile keeps the by-name map as the single source
of truth and avoids racing the model swap.
