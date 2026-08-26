# Fix shift-click anchor drift on ticking keyed tables

Shift-click on a keyed table uses the row index at click time (`selectionStartRow`)
as the extend-from anchor. On ticking tables the row that was clicked is now at a
different visual position, so shift-click extends from the wrong place and the
async row-range resolve compounds the drift.

## Team(s)

### Primary team

- **UI Team** — isolated to `web-client-ui` (`@deephaven/iris-grid`, `@deephaven/grid`).

### Cross-team dependencies

None.

## Problem / Feature Gap

Reproduction on a keyed ticking table (5 rows/sec, reversed):

1. Click row 10. Grid stores `selectionStartRow = 10`, KeyedSelection commits `{key_10}`.
2. Wait for 5 ticks. The key that was at row 10 is now visually at row 15.
3. Shift-click row 20. `moveSelection` reads the stale `selectionStartRow = 10`,
   builds range `[10, 20]`, and creates a pending KeyedSelection with
   `pendingRows = [10, 20]`.
4. `resolveKeyedSelection` fires `fetchKeyValuesForRowRange(10, 20)` async.
5. Server returns keys currently at rows 10-20 — NOT the user's intended
   rows 15-20.

Two independent bugs contribute:

- **B1 (anchor drift)**: `selectionStartRow` is a raw row index; ticks
  invalidate it. The current mouse-handler workaround
  (`IrisGridKeyedAnchorMouseHandler`) only fixes the single-key case and
  breaks after the first shift-click adds multiple keys.
- **B2 (async resolve race)**: even with the correct pending range at click
  time, the async fetch can be preempted by ticks. The rows returned differ
  from what the user targeted.

## Design

Three-part fix:

- **Part A** — replace the anchor's raw-row-index representation with a
  semantic pointer (row for `RangedSelection`, key for `KeyedSelection`).
- **Part B** — endpoint-safe async resolve: pending selections carry
  click-time endpoint key data that the resolver merges into the fetched
  map so shift-click endpoints survive tick drift.
- **Part C** — optional `fetchRowForKey` seek: when the anchor has scrolled
  out of the viewport, the resolver seeks the anchor's current row before
  fetching so the range endpoints match the user's intent (single-column
  keys only; otherwise falls back to the row hint).

### Part A — Semantic anchor on Selection

Replace the concept of "the anchor is a raw row index" with "the anchor is a
selection-mode-appropriate pointer":

- `RangedSelection`: stores `startRow/startColumn` verbatim (same as today).
- `KeyedSelection`: stores an `anchorKey` (serialized key column values)
  **and** a row hint captured at click time. When asked for its current row:
  1. Scan the viewport for the row whose key matches `anchorKey`. If any
     match, return the one nearest to the row hint (correct for tables with
     non-unique key columns) — the first match otherwise.
  2. If the anchor key has ticked out of the viewport, fall back to the
     stored row hint so shift-click still functions (drift-prone, but no
     worse than today's raw-index behavior).
  3. Return null only when no anchor was ever set.

Add to the `Selection` interface:

```ts
interface Selection {
  // ... existing
  /**
   * Returns the current visual position of the shift-click / drag anchor,
   * or null if there is no anchor.
   */
  getGestureAnchor(): { row: VisibleIndex; column: VisibleIndex } | null;

  /**
   * Returns a copy of this selection whose gesture anchor is set to the given
   * cell. Called from `beginSelection` at mouse-down time.
   */
  withGestureAnchor(
    row: VisibleIndex | null,
    column: VisibleIndex | null
  ): Selection;
}
```

`Grid`:

- Remove `selectionStartRow` / `selectionStartColumn` from `GridState` (or
  leave deprecated for one release).
- `beginSelection(row, col)` becomes
  `setState(s => ({ selection: s.selection.withGestureAnchor(row, col) }))`.
- `moveSelection`'s extend branch reads `state.selection.getGestureAnchor()`
  instead of `state.selectionStartRow/Column`.
- `selectionEndRow / selectionEndColumn` stay — they represent the transient
  drag position, which is fine as a raw index (no drift issue mid-drag).

This fixes B1 for shift-click, drag, Ctrl+Shift+Click, and arrow-key extend.

### Part B — Endpoint-safe async resolve

For shift-clicks whose range extends beyond the viewport, we still need
`fetchKeyValuesForRowRange`. To keep the endpoints correct without retries:

1. At click time, capture the raw values for both `anchor_key` (already
   tracked) and `target_key` (read from the clicked row).
2. Attach both to the pending `KeyedSelection` alongside `pendingRows`.
3. In `resolveKeyedSelection`, merge the fetched keyValues with the
   pre-captured anchor and target entries. `Map.set` gives us
   "if missing, add it" semantics.

Result:

- Anchor and target are always in the final selection (matches user's click).
- Middle rows may be off by a few if ticks arrived during the fetch, but
  the user sees the correct endpoints and count.
- Single round-trip. No retries, no laggy feedback.

For in-viewport shift-clicks, use a fast path (see below) so async is bypassed
entirely and B2 does not apply.

### Fast path — synchronous enumeration when in-viewport

`KeyedSelection.commitMouseGesture` already special-cases single-row overlays.
Extend the multi-row branch:

- If the entire overlay range is within `model.viewport`, enumerate keys
  synchronously from the model and commit them directly (no pending state,
  no async fetch).
- Otherwise, fall back to the pending selection path with the endpoint
  metadata described in Part B.

This makes the common case (viewport-sized shift-click on a ticking table)
race-free.

## Rollout

- No public API changes on `IrisGrid`.
- `Selection` interface gains two methods. Both existing implementations
  (`RangedSelection`, `KeyedSelection`) are updated in this change.
- `GridState.selectionStartRow / selectionStartColumn` are removed. Any
  external readers (unlikely; these are internal to gesture handling) would
  break. Grep confirmed no consumers outside `Grid.tsx`,
  `GridSelectionMouseHandler.ts`, and tests.
- An earlier attempt at fixing B1 added `IrisGridKeyedAnchorMouseHandler`,
  `anchorKey`, `updateAnchorKey`, and `refreshKeyedSelectionAnchor` to
  `IrisGrid`. That approach was reverted in git before this plan was
  written, so there is nothing to delete here — this design supersedes it
  by moving the anchor onto the selection itself.

## Checklist

### Selection interface

- [x] Add `getGestureAnchor()` to `Selection` interface (packages/grid/src/Selection.ts).
- [x] Add `withGestureAnchor(row, col)` to `Selection` interface.
- [x] Implement both on `RangedSelection`. `withGestureAnchor` stores in
      new fields (or reuses existing anchor fields). `getGestureAnchor`
      returns them verbatim.
- [x] Implement both on `KeyedSelection`. Store an `anchorKey` (string) and
      `anchorValues` (readonly unknown[]). `withGestureAnchor` reads the key
      at the given row via `getRowKeyData`. `getGestureAnchor` scans
      `model.viewport` for the row whose serialized key equals `anchorKey`,
      returning its visual row (or null if not currently visible).
- [x] Add a row hint fallback: also store `anchorRow: GridRangeIndex`
      captured in `withGestureAnchor`, and return it from
      `getGestureAnchor` when the key is not currently in the viewport.
      Accepts drift when the anchor is offscreen but keeps shift-click
      functional. Preserve `anchorRow` through the same mutation methods
      that preserve `anchorKey`.
- [x] Preserve the anchor through mutation methods on `KeyedSelection`:
      `withMouseGestureRanges`, `commitMouseGesture`, `resolve`, `truncate`,
      **and `trimmed`** (called by `Grid.trimSelectedRanges` on every
      shift+click/shift+pageDown before the extend). Clear on `clear`,
      `selectAll`, `withUpdatedRanges` (fresh replacement).

### Grid

- [x] `Grid.beginSelection(row, col)` calls
      `setState(s => ({ selection: s.selection.withGestureAnchor(row, col), ... }))`.
      Cursor and `selectionEndRow/Column` still set as today.
- [x] `Grid.moveSelection` reads anchor via
      `state.selection.getGestureAnchor()` instead of
      `state.selectionStartRow / selectionStartColumn`.
- [x] `Grid.setSelectedRanges` uses `withGestureAnchor` to set the anchor
      (instead of writing raw fields).
- [x] Remove `selectionStartRow` / `selectionStartColumn` from `GridState`.
      (No external readers outside `Grid.tsx` and `Grid.test.tsx`.)
- [x] `Grid.moveCursor` (uses `selectionEndRow/Column`) stays as-is.
- [x] `Grid.moveCursorInDirection` sets a new anchor via `withGestureAnchor`
      when the cursor moves outside the current selection.
- [x] Update `Grid.test.tsx` — tests that read `component.state.selectionStartRow`
      now read `component.state.selection.getGestureAnchor()?.row`.

### IrisGrid cleanup

The prior workaround (mouse handler + `anchorKey` field on `IrisGrid` +
`refreshKeyedSelectionAnchor` + `updateAnchorKey`) was already reverted in
git. Confirmed via grep:

- No `IrisGridKeyedAnchorMouseHandler` under `packages/iris-grid/src/mousehandlers/`.
- No `anchorKey`, `updateAnchorKey`, or `refreshKeyedSelectionAnchor`
  references anywhere in `packages/iris-grid/src/`.
- `IrisGrid.handleGridSelectionChange` no longer touches an anchor field.
- `IrisGrid.resolveKeyedSelection` still exists (needed for Part B).

- [x] Sanity-check before starting Part B: rerun the grep above and confirm
      nothing was reintroduced. Otherwise this section is a no-op.

### Endpoint-safe async resolve (Part B)

- [x] Add a single `endpointKeyData: ReadonlyMap<string, readonly unknown[]>`
      to `KeyedSelection` constructor (up to 2 entries: anchor + target).
      Simpler than separate anchor/target fields; the map naturally handles
      "add if missing" semantics.
- [x] Populate it in `commitMouseGesture`'s multi-row pending branch: the
      anchor entry uses the drift-immune cached `anchorKey`/`anchorValues`;
      the target entry is the endpoint of the overlay range that isn't the
      anchor's current viewport row, read via `getRowKeyData`.
- [x] `KeyedSelection.resolve` merges `endpointKeyData` into the fetched
      map before constructing the resolved selection (fetched values win
      when a key is in both, so ticked values stay fresh; endpoints just
      backfill missing keys). Encapsulated in `resolve` so
      `IrisGrid.resolveKeyedSelection` stays unchanged.
- [x] `resolve` clears `endpointKeyData` by omitting it from the returned
      selection (falls back to `EMPTY_MAP` default).
- [x] Unit tests in `KeyedSelection.test.ts`: endpoints backfill missing
      keys; fetched values are preferred when both are present.

### Fast path — synchronous in-viewport enumeration

- [x] In `KeyedSelection.commitMouseGesture`, when the multi-row overlay
      range is entirely within `[model.viewport.top, model.viewport.bottom]`,
      enumerate rows synchronously via `getRowKeyData` and build the
      resolved KeyedSelection directly (no pending state, no async fetch).
- [x] Inline the viewport check (`first >= viewTop && last <= viewBottom`)
      rather than extracting a helper — the check is a single expression
      and only used at one site.
- [x] Multi-row overlays that extend beyond viewport still take the pending
      path from Part B.
- [x] Unit tests: fast-path fully-in-viewport commit produces a resolved
      selection with all row keys; pending path with a shrunken viewport
      still returns `pendingRows`.

### Tests

- [x] `KeyedSelection.test.ts`: cover `withGestureAnchor` / `getGestureAnchor`.
      Includes cases where the anchor key ticks to a new row within the
      viewport, falls back to the row hint when the anchor scrolls out, and
      picks the row closest to the hint when the key columns are non-unique.
- [x] `KeyedSelection.test.ts`: cover the endpoint-safe merge in `resolve`
      (test that anchor and target survive when the fetched map does not
      include them; fetched values win over stale endpoint values).
- [x] `KeyedSelection.test.ts`: cover fast-path synchronous enumeration when
      the overlay is entirely in viewport (and pending path when it isn't).
- [x] `Grid.test.tsx`: existing shift-click / drag tests still pass with
      the new anchor plumbing.
- [x] `RangedSelection.test.ts`: `withGestureAnchor` / `getGestureAnchor`
      round-trip. Also covers `withMouseGestureRanges` preserving the
      anchor, `withUpdatedRanges` clearing it, and preservation through
      `commitMouseGesture` / `trimmed`.

### E2E

- [x] Added a Playwright test to `tests/table.spec.ts` for keyed
      shift-click on the `keyed_table` fixture (click row 0, shift-click
      row 2 → snapshot shows all rows for keys 0, 1, 2). Snapshot needs
      to be generated on Linux via `npm run e2e:update-ci-snapshots` at
      merge time.

### Anchor lookup for out-of-viewport shift-clicks (Part C)

For the case where the anchor has ticked out of the viewport at shift-click
time, the row-hint fallback produces a wrong pending range (endpoints are
still guaranteed by the endpoint-safe merge, but the middle is off). This
optional layer does a `seekRow` first to find the anchor's current row,
then fetches the accurate key range.

- [x] Add optional `fetchRowForKey(values): Promise<FetchRowForKeyResult>` to
      `KeyedGridModel`, where the result is a discriminated union of
      `{ status: 'found', row }` | `{ status: 'gone' }` |
      `{ status: 'unsupported' }`. The `gone` status lets the caller strip
      phantom endpoints when the anchor row was removed from the table.
- [x] Implement in `IrisGridTableModelTemplate` via `table.seekRow` for
      single-key-column tables only. Multi-column keys and tables lacking
      `seekRow` return `unsupported`; a `seekRow` result of `-1` becomes
      `gone`; any non-negative result becomes `found`.
- [x] Add `pendingAnchorLookup: { values, targetRow } | null` to
      `KeyedSelection`. Populated only in `commitMouseGesture`'s slow-path
      branch when the anchor key is not currently in the viewport.
      Preserved through the same mutations that preserve `pendingRows`
      (`withGestureAnchor`, `truncate`).
- [x] `KeyedSelection.resolve` accepts an optional `excludedEndpoints` set
      so callers can suppress endpoint-key backfill for keys they know are
      no longer in the table.
- [x] `IrisGrid.resolveKeyedSelection`: when `pendingAnchorLookup` is set
      and the model supports `fetchRowForKey`: - `found` → use `[min, max]` of anchor and target as the fetch range. - `gone` → keep the row-hint `pendingRows` but pass the anchor's key
      to `resolve` as an excluded endpoint (no phantom in the result). - `unsupported` → keep the row-hint `pendingRows` unchanged.
- [x] Unit tests: OOV anchor sets `pendingAnchorLookup`; in-viewport
      anchor does not. `fetchRowForKey` tests cover all four status
      outcomes. `resolve` test covers `excludedEndpoints`.

## Deferred

- Server-side "keys between A and B in current sort" query would eliminate
  the async race entirely for out-of-viewport shift-clicks with multi-column
  keys. Out of scope for the current fix.
- Similar anchor treatment for the drag END position (`selectionEndRow`).
  Ticks during a drag can visually shift the "end" too, but the drag is
  actively re-updating on mouse-move so the drift window is one frame. Not
  worth the churn now.
