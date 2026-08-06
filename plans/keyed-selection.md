# Keyed Selection

## Background

Some Deephaven tables have key columns (exposed via table attributes `keyColumns` and
`uniqueKeys`). For these tables, selection should be keyed rather than range-based:

- A selected key is an array of values — one per key column.
- Two selection modes are **mutually exclusive**. A grid is either in ranged mode or keyed mode; never both.
- For tables with `uniqueKeys`, each key identifies exactly one row. For non-unique keys, a key may match multiple rows.

## Goals

1. `Grid` delegates all selection logic to a pluggable `SelectionHandler` prop; defaults to `RangedSelectionHandler`.
2. `RangedSelectionHandler` wraps the current behavior with no functional change.
3. `KeyedSelectionHandler` implements keyed selection.
4. `GridRenderer` checks the active selection mode when deciding whether a row/cell is selected.
5. A new `KeyedGridModel` interface (in `iris-grid`) exposes key-column metadata. `GridModel` is **not changed**.
6. `IrisGridTableModelTemplate` reads table attributes and implements `KeyedGridModel`.
7. `IrisGrid` detects `isKeyedGridModel(model)` and passes the appropriate handler to `Grid`.
8. Downstream consumers of `onSelectionChanged` continue to work via synthesized ranges (temporary; tracked by TODO).

### Why `GridModel` stays unchanged

`Grid` is a generic, Deephaven-agnostic package. Key columns are a Deephaven concept.
`Grid` accepts a `selectionHandler` prop and defaults to `RangedSelectionHandler` — it
never inspects the model for key columns.

### Why `KeyedGridModel` is a new interface (not reusing `isInputKeyColumn`)

`IrisGridTableModelTemplate.isInputKeyColumn` / `inputKeyColumnSet` are backed by
`inputTable.keys` — they describe the key columns of an _input table_ used for
editing and deletion. The table attribute `keyColumns` is a separate concept: it
describes which columns form the natural key of a read-only (or keyed-only) table
for selection purposes. Mixing them would create confusion. New names are used:
`selectionKeyColumnIndices` and `hasUniqueSelectionKeys`.

> **Already done**: `keyColumnSet` → `inputKeyColumnSet`, `isKeyColumn` → `isInputKeyColumn`,
> `getMemoizedKeyColumnSet` → `getMemoizedInputKeyColumnSet` across all call sites.

## Steps

### Step 1 — `SelectionHandler` interface (`packages/grid/src/`)

Create `SelectionHandler.ts` defining:

```ts
interface SelectionHandler {
  // Called when the user starts a new selection gesture
  beginSelection(column: GridRangeIndex, row: GridRangeIndex): void;
  // Called while the user drags or shift-clicks
  moveSelection(
    column: GridRangeIndex,
    row: GridRangeIndex,
    extendSelection?: boolean,
    maximizePreviousRange?: boolean
  ): void;
  // Commits the in-progress selection (dedup, subtract, consolidate)
  commitSelection(): void;
  clearSelectedRanges(): void;
  trimSelectedRanges(): void;
  selectAll(): void;
  isSelected(row: VisibleIndex, column: VisibleIndex): boolean;
  // Returns current selection as GridRange[].
  // In keyed mode this synthesizes ranges (temporary — see TODO below).
  getSelectedRanges(): readonly GridRange[];
  setSelectedRanges(ranges: readonly GridRange[]): void;
  // The set of serialised keys; undefined in ranged mode
  readonly selectedKeys?: ReadonlySet<string>;
}
```

Export from `packages/grid/src/index.ts`.

---

### Step 2 — `RangedSelectionHandler` (`packages/grid/src/selection-handlers/`)

Extract the existing selection logic out of `Grid` into `RangedSelectionHandler`:

- Move the bodies of `beginSelection`, `moveSelection`, `commitSelection`,
  `clearSelectedRanges`, `trimSelectedRanges`, `selectAll`, `isSelected`,
  `getSelectedRanges`, `setSelectedRanges` verbatim.
- Constructor receives `grid: Grid` (same pattern as `GridMouseHandler`).
- All state mutations go through `grid.setState(...)`.

This step should be a pure refactor — no behavioural change.

---

### Step 3 — `KeyedSelectionHandler` (`packages/grid/src/selection-handlers/`)

New implementation of `SelectionHandler`. Receives a `grid: Grid` reference.
Also receives `keyColumnIndices: readonly ModelIndex[]` — supplied by `IrisGrid`
when it constructs this handler.

**State** (stored in `GridState`):

- `selectedKeys: ReadonlySet<string>` — serialised key tuples (`JSON.stringify(values)`)

**Key serialisation helper** (private):

```ts
serializeKey(modelRow: ModelIndex): string {
  const { model } = this.grid.props;
  const values = this.keyColumnIndices.map(col => model.valueForCell(col, modelRow));
  return JSON.stringify(values);
}
```

**`beginSelection(column, row)`**

- Resolve `modelRow` from visible `row`.
- Serialise key; toggle it in `selectedKeys`.
- Update cursor state.

**`moveSelection(column, row, extendSelection)`**

- If `extendSelection` (shift-click): collect all serialised keys from the
  cursor row to `row` (stepping through model rows), add/remove them all.
- Otherwise: same as `beginSelection`.

**`commitSelection()`**

- No-op for keyed selection (keys are toggled immediately in `beginSelection`/`moveSelection`).

**`clearSelectedRanges()`**

- `grid.setState({ selectedKeys: new Set() })`.

**`isSelected(row, column)`**

- Resolve `modelRow`; return `selectedKeys.has(serializeKey(modelRow))`.

**`getSelectedRanges()`**

- TODO: synthesizing ranges from keys does not scale to millions of rows.
  For now, scan all model rows, collect those whose key is in `selectedKeys`,
  and build `GridRange` list.

**`setSelectedRanges(ranges)`**

- No-op or throw — keyed tables should not receive programmatic range selections.
  Log a warning.

**`selectAll()`**

- No-op for now (selecting all keys would require scanning all rows).

---

### Step 4 — `GridState` additions (`packages/grid/src/Grid.tsx`)

Add to `GridState`:

```ts
/** Active when a KeyedSelectionHandler is in use; undefined otherwise. */
selectedKeys: ReadonlySet<string> | undefined;
```

Initialise to `undefined` in constructor.

---

### Step 5 — Wire `SelectionHandler` into `Grid` (`packages/grid/src/Grid.tsx`)

- Add optional prop `selectionHandler?: SelectionHandler` to `GridProps`.
- Add instance field `selectionHandler: SelectionHandler`.
- In constructor, set `this.selectionHandler = props.selectionHandler ?? new RangedSelectionHandler(this)`.
- In `componentDidUpdate`, if `props.selectionHandler` changed, update `this.selectionHandler`.
- Replace each selection method body with a one-line delegation:
  ```ts
  beginSelection(column, row) { this.selectionHandler.beginSelection(column, row); }
  // … etc.
  ```
- Keep the public method signatures identical so callers (mouse handlers, key
  handlers, `IrisGrid`) require no changes.

---

### Step 6 — `GridRenderer` selection check

`GridRenderer` currently tests `GridRange.containsCell(selectedRanges, ...)`.

Add `selectedKeys` and `selectionKeyColumnIndices` to `GridRenderState`.
When `selectedKeys` is defined, the renderer computes the key for a row using
`selectionKeyColumnIndices` + `model.valueForCell` and checks `selectedKeys.has(...)`.

---

### Step 7 — `KeyedGridModel` interface (`packages/iris-grid/src/`)

New file `KeyedGridModel.ts` following the pattern of `EditableGridModel` / `DeletableGridModel`:

```ts
export interface KeyedGridModel {
  /** Model column indices forming the row key for selection purposes. */
  readonly selectionKeyColumnIndices: readonly ModelIndex[];
  /** True if each key uniquely identifies at most one row. */
  readonly hasUniqueSelectionKeys: boolean;
}

export function isKeyedGridModel(model: unknown): model is KeyedGridModel {
  return (model as KeyedGridModel).selectionKeyColumnIndices != null;
}
```

Note: these fields are distinct from `isInputKeyColumn` / `inputKeyColumnSet` which are
input-table editing concepts backed by `inputTable.keys`.

---

### Step 8 — `IrisGridTableModelTemplate` implementation

Read table attributes and implement `KeyedGridModel`:

```ts
getMemoizedSelectionKeyColumnIndices = memoize(
  (columns: DhType.Column[], raw: unknown): readonly ModelIndex[] | undefined => {
    if (raw == null || typeof raw !== 'string') return undefined;
    return raw.split(',').map(name => {
      const idx = columns.findIndex(c => c.name === name);
      if (idx < 0) throw new Error(`Key column not found: ${name}`);
      return idx;
    });
  }
);

get selectionKeyColumnIndices(): readonly ModelIndex[] | undefined {
  return this.getMemoizedSelectionKeyColumnIndices(
    this.columns,
    this.table.getAttribute('keyColumns')
  );
}

get hasUniqueSelectionKeys(): boolean {
  return this.table.getAttribute('uniqueKeys') === 'true';
}
```

`isKeyedGridModel(this)` returns `true` only when `selectionKeyColumnIndices` is
non-null, so non-keyed tables automatically fall through to ranged selection.

---

### Step 9 — `IrisGrid` wires the handler

In `IrisGrid`, after model is available:

```ts
private buildSelectionHandler(): SelectionHandler {
  const { model } = this.props;
  if (isKeyedGridModel(model) && model.selectionKeyColumnIndices != null) {
    return new KeyedSelectionHandler(this.grid!, model.selectionKeyColumnIndices);
  }
  return new RangedSelectionHandler(this.grid!);
}
```

Pass as `<Grid selectionHandler={this.buildSelectionHandler()} ...>`.

Rebuild when `model` changes in `componentDidUpdate`.

---

### Step 10 — `onSelectionChanged` downstream compat

`Grid.checkSelectionChange` calls `onSelectionChanged(selectedRanges)`.

In keyed mode, `selectedRanges` will be synthesized (and may be empty for large tables).

- Add a TODO comment explaining this is temporary.
- Ensure `handleSelectionChanged` in `IrisGrid` handles an empty range array without
  crashing (it already does, but verify).
- No other changes needed for the initial implementation.

---

### Step 11 — Tests

- `RangedSelectionHandler`: existing `Grid` selection tests should continue to pass
  once moved/adapted.
- `KeyedSelectionHandler`: unit tests for `beginSelection`, `moveSelection` (shift),
  `isSelected`, `getSelectedRanges` (synthesis), `clearSelectedRanges`.
- `IrisGridTableModelTemplate`: unit test `selectionKeyColumnIndices` and
  `hasUniqueSelectionKeys` getters using a mocked table with attribute stubs.
  Verify these are independent of `inputTable.keys` / `inputKeyColumnSet`.

---

## Out of scope (follow-on work)

- Replace synthesized `getSelectedRanges` with a proper `onKeySelectionChanged` callback.
- Keyboard navigation within keyed selection (arrow keys jump to next matched row).
- `selectAll` for keyed tables.
- Visual differentiation of key columns in the header (e.g. key icon).
