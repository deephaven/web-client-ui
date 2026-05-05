# DH-20403 — Persist user column widths by name end-to-end

Follow-up split out of [PR #2668](https://github.com/deephaven/web-client-ui/pull/2668)
(DH-22326). That PR's "Future work" section called out the dual
by-index / by-name representation as the next thing to address; this PR
threads `userColumnWidthsByName` end-to-end through the persistence boundary
so saved layouts retain hidden-column state across model swaps.

## Problem

Reproduction:

1. Open the stocks table, hide all columns except `Random`.
2. Apply a rollup grouping by `Sym` → only `Sym` and `Random` are visible.
3. Reload the browser → the rollup with two visible columns is restored correctly.
4. Remove the `Sym` grouping in the rollup settings.

Expected: `Sym` and `Random` remain the only visible columns.
Actual: every column becomes visible.

## Root cause

Hidden state is stored in `IrisGridMetricCalculator` in two maps:

- `userColumnWidths: Map<ModelIndex, number>` — derived view, regenerated on
  every model swap.
- `userColumnWidthsByName: Map<ColumnName, number>` — source of truth that
  survives model swaps (rollup apply/remove, select-distinct, etc.).
  `updateUserColumnWidths(model)` re-projects from this map on every metrics
  pass.

The persistence boundary in `IrisGridUtils` only knows about the by-index map:

- `dehydrateIrisGridState` reads `metrics.userColumnWidths` (by index) and
  serializes `[columnName, width][]` against the **current** model's
  `columns`. While a rollup is active, columns absent from the rolled-up
  model are missing from the by-index map and therefore dropped.
- `hydrateIrisGridState` re-projects the persisted `[name, width][]` array
  back into a `Map<ModelIndex, number>` against the **current** model.
  Names that don't resolve get filtered out. The metric calculator's
  constructor only sees the by-index map, so `userColumnWidthsByName` starts
  empty after a reload.

Net effect: when the rollup is removed, `updateUserColumnWidths` rebuilds the
by-index map from an empty by-name map → all hidden columns become visible.
This is data loss at the persistence boundary, not a runtime calculation bug.

## Approach: thread `userColumnWidthsByName` end-to-end

Make column **names** the source of truth across the persistence boundary.
The persisted form is already `[ColumnName, number][]`, so no schema bump is
needed. We just need to stop discarding entries during hydrate, and read
from the by-name map during dehydrate.

### Steps

1. **Extend `IrisGridMetricCalculator`** ([packages/iris-grid/src/IrisGridMetricCalculator.ts](packages/iris-grid/src/IrisGridMetricCalculator.ts))
   - Accept an optional `userColumnWidthsByName: Map<ColumnName, number>` in
     the constructor; initialize the field from it when supplied.
   - Add `getUserColumnWidthsByName(): ReadonlyMap<ColumnName, number>`.
   - No changes to the projection logic — `updateUserColumnWidths` (L180)
     already projects by-name → by-index on every model swap.

2. **Add `userColumnWidthsByName` prop to `IrisGrid`** ([packages/iris-grid/src/IrisGrid.tsx](packages/iris-grid/src/IrisGrid.tsx))
   - Type as `ReadonlyMap<ColumnName, number>`, optional, default `EMPTY_MAP`.
   - Pass into `getMetricCalculator({...})` at L792.
   - Keep the existing `userColumnWidths` prop as a back-compat fallback for
     callers that haven't migrated; mark deprecated in JSDoc.

3. **Update `IrisGridUtils.hydrateIrisGridState`** ([packages/iris-grid/src/IrisGridUtils.ts](packages/iris-grid/src/IrisGridUtils.ts), L1268)
   - Stop dropping name entries that don't resolve in `model.columns`.
   - Return both `userColumnWidths` (the index-projected, current-model
     subset, kept for back-compat with consumers reading widths immediately
     after hydrate) **and** `userColumnWidthsByName` (the full preserved
     map). Update `HydratedIrisGridState` accordingly.

4. **Update `IrisGridUtils.dehydrateIrisGridState`** ([packages/iris-grid/src/IrisGridUtils.ts](packages/iris-grid/src/IrisGridUtils.ts), L1187)
   - Read widths from `metrics.userColumnWidthsByName` when present, falling
     back to deriving from `metrics.userColumnWidths` against `model.columns`
     (current behavior). This closes the loop — saved state stops shrinking
     on every save.

5. **Plumb through panel hosts**
   - [packages/dashboard-core-plugins/src/panels/IrisGridPanel.tsx](packages/dashboard-core-plugins/src/panels/IrisGridPanel.tsx):
     destructure `userColumnWidthsByName` from `hydrateIrisGridState`
     (L1049), store in state alongside `userColumnWidths`, pass as prop at
     L1266. Initial state defaults to an empty map (L315).
   - [packages/dashboard-core-plugins/src/GridWidgetPlugin.tsx](packages/dashboard-core-plugins/src/GridWidgetPlugin.tsx):
     `hydrateIrisGridState` already spreads its return into `hydratedState`
     (L59), so confirm the new field flows to `IrisGrid`.

### Tests

- `IrisGridMetricCalculator.test.ts`
  - Constructor seeds `userColumnWidthsByName`.
  - `updateUserColumnWidths` projects to the current model and preserves
    entries for absent names across a model swap.

- `IrisGridUtils.test.ts`
  - dehydrate → hydrate → dehydrate round-trip preserves a width entry for a
    column **not present** in the current model (the regression).

- `IrisGrid.test.tsx`
  - Existing `handleRollupChange` tests still pass.
  - Construct `IrisGrid` with `userColumnWidthsByName` containing a hidden
    column not present in the current rolled-up model; assert it remains
    hidden after a model swap.

### Verification

1. Manual repro of the user's scenario via DevTools MCP: open stocks, hide
   all but `Random`, rollup on `Sym`, reload, remove rollup → only `Sym` and
   `Random` visible.
2. Unit tests above pass; existing tests remain green.
3. `npx tsc -p packages/iris-grid/tsconfig.json --noEmit` and
   `npx tsc -p packages/dashboard-core-plugins/tsconfig.json --noEmit` clean.
4. `eslint` clean on modified files.

## Decisions / scope guardrails

- Single source of truth for hidden-column state in memory =
  `userColumnWidthsByName` on `IrisGridMetricCalculator`. The by-index map is
  a derived view, repopulated by `updateUserColumnWidths` on every model
  swap (already true today).
- Persisted form stays `[ColumnName, number][]` — no schema bump.
- Out of scope: reworking `userRowHeights` (rows aren't subject to model
  column swaps).
- Out of scope: hard-removing the legacy `userColumnWidths` prop on
  `IrisGrid` — kept as a deprecated back-compat path.
- No data migration needed: existing persisted state is already by name.

## Alternatives considered

### Hydrate against `originalColumns`

Use `(model as IrisGridProxyModel).originalColumns ?? model.columns` for the
name-to-index lookup in `hydrateIrisGridState`.

- Pros: ~5 lines, no prop plumbing.
- Cons:
  - Doesn't fix dehydrate. With a rollup active, the by-index map still
    misses absent columns, so save-after-reload still drops them.
  - `originalColumns` is `IrisGridProxyModel`-specific. Surfacing it in
    `IrisGridUtils` leaks rollup semantics into model-agnostic code.
  - Doesn't help select-distinct or other future model-swap features whose
    `originalColumns` is the post-swap set.

### Hybrid: hydrate against `originalColumns` + dehydrate from by-name

Equivalent in correctness to the chosen approach but still leaks
`originalColumns` into utils. The metric calculator's by-name map is still
the right source for dehydrate, so we'd still need to expose it; at that
point the marginal cost of adding the prop to `IrisGrid` is tiny and
future-proofs against further model swaps.

### Drop the by-index map from props entirely

`hydrateIrisGridState` returns only `userColumnWidthsByName`. Simpler mental
model, but a breaking change for the panel and any external consumers
reading `userColumnWidths` from props. Out of scope for this PR (kept as a
back-compat path); see "Future work" below.

## Future work

Once this PR ships and the deprecation has been advertised for a release,
follow up with the cleanup: remove the by-index `userColumnWidths` prop on
`IrisGrid` and the matching field from `HydratedIrisGridState`, leaving
`userColumnWidthsByName` as the only width prop. This eliminates the dual
representation that motivated the by-name plumbing in the first place and
removes the back-compat fallback in the metric calculator constructor and
`dehydrateIrisGridState`. Tracked separately to keep this PR focused and to
give downstream consumers a release window to migrate.
