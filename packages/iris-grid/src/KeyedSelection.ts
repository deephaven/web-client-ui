import { EMPTY_ARRAY, EMPTY_MAP } from '@deephaven/utils';
import {
  type CommitGestureOptions,
  type GestureExtendOptions,
  type GridRange,
  type GridRangeIndex,
  type ModelIndex,
  type SELECTION_DIRECTION,
  type Selection,
  type VisibleIndex,
  computeGestureExtend,
  cursorLandingCellForRanges,
  nextCursorInRanges,
} from '@deephaven/grid';
import type IrisGridModel from './IrisGridModel';
import type { KeyedGridModel } from './KeyedGridModel';

export type GetKeyedModel = () => IrisGridModel & KeyedGridModel;

/**
 * Serializes key-column values to a stable string for use as a Map/Set key.
 * JSON.stringify encodes NaN, Infinity, and -Infinity as null, so we
 * substitute sentinel strings to preserve their distinct identities.
 */
export function serializeKeyValues(values: readonly unknown[]): string {
  return JSON.stringify(values, (_key, value) => {
    if (typeof value === 'number') {
      if (Number.isNaN(value)) return '__NaN__';
      if (value === Infinity) return '__Infinity__';
      if (value === -Infinity) return '__-Infinity__';
    }
    return value;
  });
}

/**
 * Configuration for a `KeyedSelection`. `getModel` is required; every
 * other field defaults to an "empty" value (`null`, an empty set/map, or
 * `false` where appropriate).
 */
export type KeyedSelectionOptions = {
  /**
   * Deferred lookup for the current `KeyedGridModel`. Passed as a closure
   * (not a direct reference) so this Selection always reads the model
   * currently on `Grid.props.model` — surviving prop swaps without holding
   * a stale reference.
   */
  getModel: GetKeyedModel;
  /**
   * Serialized keys that identify the committed selection. Interpreted as
   * an inclusion set by default; as an exclusion set when
   * `invertedSelection` is true.
   */
  selectedKeys?: ReadonlySet<string>;
  /**
   * Ranges from the in-progress mouse gesture. Cleared on commit; used to
   * render an overlay before the gesture settles.
   */
  overlayRanges?: readonly GridRange[];
  /**
   * When true, `selectedKeys` is an exclusion set: all rows are selected
   * EXCEPT those in the set.
   */
  invertedSelection?: boolean;
  /**
   * Last committed single-row position; best-effort, may be stale after
   * table ticks. Consumed by `getLastSingleSelectedRow` (drives gotoRow).
   */
  lastSingleRow?: VisibleIndex | null;
  /**
   * Raw key-column values for each committed key; used for server-side
   * filter construction (e.g. `buildKeyFilter`).
   */
  selectedKeyValues?: ReadonlyMap<string, readonly unknown[]>;
  /**
   * When non-null, limits snapshot results to this many rows via the
   * viewport subscription.
   */
  maxRows?: number | null;
  /**
   * Ranges whose key values are being resolved asynchronously by
   * `IrisGrid.resolveKeyedSelection`. Empty array means no resolution is in progress.
   */
  pendingRanges?: readonly GridRange[];
  /**
   * Serialized key of the shift-click / drag anchor. Lets `getGestureAnchor`
   * find where the anchor row moved to after a tick, so shift-click extends
   * from the row the user actually clicked, not from a stale row index.
   */
  anchorKey?: string | null;
  /** Anchor row at click time. Fallback when the anchor key is out of viewport. */
  anchorRow?: GridRangeIndex;
};

/**
 * Immutable `Selection` for keyed tables: identifies rows by their
 * serialized key-column values rather than raw row indices, so the
 * selection survives ticks that shuffle row positions.
 *
 * Rows sharing the same key highlight together (see `isRowSelected`).
 * When `invertedSelection` is true, `selectedKeys` is treated as an
 * exclusion set (all rows selected except those keys).
 */
export class KeyedSelection implements Selection {
  static empty(getModel: GetKeyedModel): KeyedSelection {
    return new KeyedSelection({ getModel });
  }

  private readonly getModel: GetKeyedModel;

  readonly selectedKeys: ReadonlySet<string>;

  private readonly overlayRanges: readonly GridRange[];

  readonly invertedSelection: boolean;

  private readonly lastSingleRow: VisibleIndex | null;

  readonly selectedKeyValues: ReadonlyMap<string, readonly unknown[]>;

  readonly maxRows: number | null;

  readonly pendingRanges: readonly GridRange[];

  private readonly anchorKey: string | null;

  private readonly anchorRow: GridRangeIndex;

  /** Keys derived from the current overlay range's viewport-visible rows. */
  private readonly gestureKeys: ReadonlySet<string>;

  constructor(options: KeyedSelectionOptions) {
    this.getModel = options.getModel;
    this.selectedKeys = options.selectedKeys ?? new Set();
    this.overlayRanges = options.overlayRanges ?? EMPTY_ARRAY;
    this.invertedSelection = options.invertedSelection ?? false;
    this.lastSingleRow = options.lastSingleRow ?? null;
    this.selectedKeyValues = options.selectedKeyValues ?? EMPTY_MAP;
    this.maxRows = options.maxRows ?? null;
    this.pendingRanges = options.pendingRanges ?? EMPTY_ARRAY;
    this.anchorKey = options.anchorKey ?? null;
    this.anchorRow = options.anchorRow ?? null;

    // Enumerate only viewport-visible rows so gesture key lookup stays O(1)
    // and construction is O(viewport) regardless of total table size.
    if (this.overlayRanges.length === 0) {
      this.gestureKeys = new Set();
    } else {
      const model = this.getModel();
      const viewTop = model.viewport?.top ?? 0;
      const viewBottom = model.viewport?.bottom ?? 0;
      const keys = new Set<string>();
      for (let i = 0; i < this.overlayRanges.length; i += 1) {
        const { startRow, endRow } = this.overlayRanges[i];
        if (startRow == null) continue; // eslint-disable-line no-continue
        const last = endRow ?? startRow;
        const clampedStart = Math.max(startRow, viewTop);
        const clampedEnd = Math.min(last, viewBottom);
        for (let r = clampedStart; r <= clampedEnd; r += 1) {
          keys.add(this.getRowKeyData(r).key);
        }
      }
      this.gestureKeys = keys;
    }
  }

  /**
   * Returns a copy of this selection with the given fields overridden.
   * Unspecified fields carry through; pass `null` (or an empty
   * set/map/false) to explicitly clear a field.
   */
  private copyWith(overrides: Partial<KeyedSelectionOptions>): KeyedSelection {
    return new KeyedSelection({
      getModel: this.getModel,
      selectedKeys: this.selectedKeys,
      overlayRanges: this.overlayRanges,
      invertedSelection: this.invertedSelection,
      lastSingleRow: this.lastSingleRow,
      selectedKeyValues: this.selectedKeyValues,
      maxRows: this.maxRows,
      pendingRanges: this.pendingRanges,
      anchorKey: this.anchorKey,
      anchorRow: this.anchorRow,
      ...overrides,
    });
  }

  /** Returns both the serialized key and the raw values for a visible row. */
  private getRowKeyData(row: VisibleIndex): {
    key: string;
    values: readonly unknown[];
  } {
    const model = this.getModel();
    const values = model.selectionKeyColumnIndices.map((col: ModelIndex) =>
      model.valueForCell(col, row)
    );
    return { key: serializeKeyValues(values), values };
  }

  isEmpty(): boolean {
    // Inverted selection means all rows are selected — never empty.
    if (this.invertedSelection) return false;
    // Pending resolution means a selection is in progress — not empty.
    if (this.pendingRanges.length > 0) return false;
    return this.selectedKeys.size === 0 && this.gestureKeys.size === 0;
  }

  // Keyed selection is always full-row; column is irrelevant
  isCellSelected(_column: VisibleIndex, row: VisibleIndex): boolean {
    return this.isRowSelected(row);
  }

  isRowSelected(row: VisibleIndex): boolean {
    const { key } = this.getRowKeyData(row);
    if (this.invertedSelection) return !this.selectedKeys.has(key);
    // Include gesture preview keys so key-siblings highlight on mousedown without waiting for commit.
    return this.selectedKeys.has(key) || this.gestureKeys.has(key);
  }

  // Only fully selected when the inversion covers every row (i.e. select-all).
  isColumnSelected(_column: VisibleIndex): boolean {
    return this.invertedSelection && this.selectedKeys.size === 0;
  }

  getLastSingleSelectedRow(): VisibleIndex | null {
    if (this.invertedSelection || this.selectedKeys.size !== 1) return null;
    return this.lastSingleRow;
  }

  getNextCursorInDirection(
    current: { row: GridRangeIndex; column: GridRangeIndex },
    direction: SELECTION_DIRECTION
  ): { row: GridRangeIndex; column: GridRangeIndex } | null {
    const { columnCount, rowCount } = this.getModel();
    return nextCursorInRanges(this.overlayRanges, current, direction, {
      columnCount,
      rowCount,
    });
  }

  getCursorLandingCell(): {
    row: GridRangeIndex;
    column: GridRangeIndex;
  } | null {
    const { columnCount, rowCount } = this.getModel();
    return cursorLandingCellForRanges(this.overlayRanges, {
      columnCount,
      rowCount,
    });
  }

  /**
   * Replaces the transient overlay ranges (mid-gesture preview) with the
   * given ranges. Preserves the gesture anchor so mid-drag range updates
   * don't clobber the shift-click origin.
   *
   * When `isReplacing` is true the caller intends the overlay to replace
   * the current committed selection (drag / shift+click); previously
   * committed keys are dropped so the commit uses the overlay as a fresh
   * selection. Otherwise the committed keys are kept, letting a subsequent
   * `commitGesture` fold the overlay into the existing set.
   */
  private withMouseGestureRanges(
    ranges: readonly GridRange[],
    isReplacing = false
  ): KeyedSelection {
    if (isReplacing) {
      return this.copyWith({
        selectedKeys: new Set(),
        overlayRanges: ranges,
        invertedSelection: false,
        lastSingleRow: null,
        selectedKeyValues: EMPTY_MAP,
        pendingRanges: EMPTY_ARRAY,
      });
    }
    return this.copyWith({
      overlayRanges: ranges,
      lastSingleRow: null,
      pendingRanges: EMPTY_ARRAY,
    });
  }

  /**
   * Sets the gesture anchor (extend-from position for shift-click and
   * keyboard extend) to the row's key. Passing `null` clears the anchor.
   */
  private withGestureAnchor(row: GridRangeIndex): KeyedSelection {
    const nextKey = row != null ? this.getRowKeyData(row).key : null;
    if (nextKey === this.anchorKey && row === this.anchorRow) return this;
    return this.copyWith({ anchorKey: nextKey, anchorRow: row });
  }

  /**
   * The current `{row, column}` of the gesture anchor, or `null` if none is
   * set. Because `KeyedSelection` tracks the anchor by serialized key, the
   * anchor's visible row may drift as the viewport scrolls. Resolves the
   * key against the current viewport when possible; falls back to the
   * click-time row hint (`anchorRow`) when the key has scrolled out. Returns
   * `null` only when neither is set.
   */
  private getGestureAnchor(): {
    row: GridRangeIndex;
    column: GridRangeIndex;
  } | null {
    if (this.anchorKey == null && this.anchorRow == null) return null;
    if (this.anchorKey != null) {
      const viewportRow = this.findKeyInViewport(this.anchorKey);
      if (viewportRow != null) return { row: viewportRow, column: null };
    }
    // Anchor key is not in the viewport; fall back to the click-time row hint.
    return { row: this.anchorRow, column: null };
  }

  /**
   * Returns the visible row of `key`, or `null` if it's not in the viewport.
   * When multiple rows share the key (non-unique key columns), prefers the one
   * closest to `anchorRow` so we track the row the user actually clicked.
   */
  private findKeyInViewport(key: string): VisibleIndex | null {
    const model = this.getModel();
    const viewTop = model.viewport?.top ?? 0;
    const viewBottom = model.viewport?.bottom ?? 0;
    const hint = this.anchorRow;
    let best: VisibleIndex | null = null;
    let bestDist = Infinity;
    for (let r = viewTop; r <= viewBottom; r += 1) {
      if (this.getRowKeyData(r).key !== key) continue; // eslint-disable-line no-continue
      if (hint == null) return r;
      const dist = Math.abs(r - hint);
      if (dist < bestDist) {
        best = r;
        bestDist = dist;
      }
    }
    return best;
  }

  withGestureExtend(
    cursor: { row: GridRangeIndex; column: GridRangeIndex },
    opts: GestureExtendOptions
  ): KeyedSelection {
    const { newRanges, isReplacing, trimBefore, resetAnchor } =
      computeGestureExtend(
        this.overlayRanges,
        this.getGestureAnchor(),
        cursor,
        opts
      );
    const base = trimBefore ? this.trimmed() : this;
    let result = base.withMouseGestureRanges(newRanges, isReplacing);
    if (resetAnchor) {
      // Keyed selection is row based, so column is not used in the anchor.
      result = result.withGestureAnchor(cursor.row);
    }
    return result;
  }

  commitGesture(
    lastCommitted: Selection,
    _opts: CommitGestureOptions
  ): KeyedSelection {
    if (this.overlayRanges.length === 0) return this;

    // Scan ranges for endpoints and total row count
    let first: VisibleIndex | null = null;
    let lastRow: VisibleIndex = 0;
    let rowCount = 0;
    for (let i = 0; i < this.overlayRanges.length; i += 1) {
      const { startRow, endRow } = this.overlayRanges[i];
      if (startRow == null) continue; // eslint-disable-line no-continue
      const rEnd = endRow ?? startRow;
      if (first === null) first = startRow;
      lastRow = rEnd;
      rowCount += rEnd - startRow + 1;
    }
    if (first === null || rowCount === 0) return this;

    const next = new Set(this.selectedKeys);

    if (this.selectedKeys.size > 0 || this.invertedSelection) {
      // Ctrl+click path: clearSelectedRanges was not called, so selectedKeys still
      // holds the previous committed keys. A single-row overlay is a ctrl+click
      // on a cell — toggle its selection. A multi-row overlay is a ctrl+shift+click
      // grown range — add all rows without toggling off overlapping ones.
      const shouldToggle = rowCount === 1;
      const nextKeyValues = new Map(this.selectedKeyValues);
      for (let i = 0; i < this.overlayRanges.length; i += 1) {
        const { startRow, endRow } = this.overlayRanges[i];
        if (startRow == null) continue; // eslint-disable-line no-continue
        const rEnd = endRow ?? startRow;
        for (let r = startRow; r <= rEnd; r += 1) {
          const { key: k, values } = this.getRowKeyData(r);
          if (shouldToggle && lastCommitted.isRowSelected(r)) {
            // Toggle off: ctrl+click on an already-selected row deselects it.
            if (this.invertedSelection) {
              next.add(k);
              nextKeyValues.set(k, values);
            } else {
              next.delete(k);
              nextKeyValues.delete(k);
            }
          } else if (this.invertedSelection) {
            next.delete(k);
            nextKeyValues.delete(k);
          } else {
            next.add(k);
            nextKeyValues.set(k, values);
          }
        }
      }
      return this.copyWith({
        selectedKeys: next,
        overlayRanges: EMPTY_ARRAY,
        lastSingleRow: null,
        selectedKeyValues: nextKeyValues,
        pendingRanges: EMPTY_ARRAY,
      });
    }

    // Regular click path: clearSelectedRanges emptied selectedKeys first.
    // Multi-row shift selections may span out-of-viewport rows where valueForCell
    // returns null. Defer those to async resolution in IrisGrid.
    // Assumes shift+click/drag emits one contiguous overlay range; `first`/`lastRow`
    // are that range's endpoints and drive the anchor/target endpoint capture below.
    if (rowCount > 1) {
      const model = this.getModel();
      const viewTop = model.viewport?.top ?? 0;
      const viewBottom = model.viewport?.bottom ?? 0;

      // Fast path: entire range is in the viewport, so we can enumerate keys
      // synchronously and skip the async fetch race entirely.
      if (first >= viewTop && lastRow <= viewBottom) {
        const nextKeyValues = new Map<string, readonly unknown[]>();
        for (let r = first; r <= lastRow; r += 1) {
          const { key: k, values } = this.getRowKeyData(r);
          nextKeyValues.set(k, values);
        }
        return this.copyWith({
          selectedKeys: new Set(nextKeyValues.keys()),
          overlayRanges: EMPTY_ARRAY,
          invertedSelection: false,
          lastSingleRow: null,
          selectedKeyValues: nextKeyValues,
          pendingRanges: EMPTY_ARRAY,
        });
      }

      // Slow path: same async-fetch mechanism as `withCommittedRanges`.
      // `IrisGrid.resolveKeyedSelection` fetches keys for the overlay ranges;
      // rows that scroll away during the fetch are dropped from the result.
      return this.copyWith({
        selectedKeys: new Set(),
        invertedSelection: false,
        lastSingleRow: null,
        selectedKeyValues: EMPTY_MAP,
        pendingRanges: this.overlayRanges,
      });
    }

    // Single-row path (rowCount === 1): first === lastRow.
    const row = first;
    const { key: k, values } = this.getRowKeyData(row);
    const nextKeyValues = new Map(this.selectedKeyValues);
    // Deselect only when the clicked row was the entire previous committed selection.
    const wasEntireSelection =
      lastCommitted instanceof KeyedSelection &&
      !lastCommitted.invertedSelection &&
      lastCommitted.selectedKeys.size === 1 &&
      lastCommitted.selectedKeys.has(k);
    if (wasEntireSelection) {
      next.delete(k);
      nextKeyValues.delete(k);
    } else {
      next.add(k);
      nextKeyValues.set(k, values);
    }
    // Store the single committed row so getLastSingleSelectedRow() works for gotoRow sync.
    const singleRow = next.size === 1 ? row : null;
    return this.copyWith({
      selectedKeys: next,
      overlayRanges: EMPTY_ARRAY,
      invertedSelection: false,
      lastSingleRow: singleRow,
      selectedKeyValues: nextKeyValues,
      pendingRanges: EMPTY_ARRAY,
    });
  }

  clear(): KeyedSelection {
    return new KeyedSelection({ getModel: this.getModel });
  }

  // Shift+click needs a clean slate so the range replaces rather than extends the old keys.
  // Anchor is preserved so shift+click's extend reads it after the trim.
  trimmed(): KeyedSelection {
    return this.copyWith({
      selectedKeys: new Set(),
      overlayRanges: EMPTY_ARRAY,
      invertedSelection: false,
      lastSingleRow: null,
      selectedKeyValues: EMPTY_MAP,
      maxRows: null,
      pendingRanges: EMPTY_ARRAY,
    });
  }

  // Always returns non-inverted; switching to a new selection exits inverted mode.
  withCommittedRanges(
    ranges: readonly GridRange[],
    anchor?: { row: GridRangeIndex; column: GridRangeIndex }
  ): KeyedSelection {
    const result = this.installCommittedRanges(ranges);
    if (anchor === undefined) return result;
    // Keyed selection is row based, so column is not used in the anchor.
    return result.withGestureAnchor(anchor.row);
  }

  private installCommittedRanges(ranges: readonly GridRange[]): KeyedSelection {
    // Replacement semantics: discard previous selection and select exactly these rows.
    if (ranges.length === 0) {
      return new KeyedSelection({ getModel: this.getModel });
    }

    // Compute the true min/max across every range so the viewport check is
    // correct even when input ranges arrive out of order or non-contiguous
    // (e.g. plugin-driven programmatic selection).
    let minRow: VisibleIndex | null = null;
    let maxRow: VisibleIndex | null = null;
    for (let i = 0; i < ranges.length; i += 1) {
      const { startRow, endRow } = ranges[i];
      if (startRow == null) continue; // eslint-disable-line no-continue
      const rEnd = endRow ?? startRow;
      const low = Math.min(startRow, rEnd);
      const high = Math.max(startRow, rEnd);
      if (minRow === null || low < minRow) minRow = low;
      if (maxRow === null || high > maxRow) maxRow = high;
    }
    if (minRow === null || maxRow === null) {
      return new KeyedSelection({ getModel: this.getModel });
    }

    const model = this.getModel();
    const viewTop = model.viewport?.top ?? 0;
    const viewBottom = model.viewport?.bottom ?? 0;

    // Fast path: every range fits in the viewport, so valueForCell answers
    // synchronously with real values.
    if (minRow >= viewTop && maxRow <= viewBottom) {
      const next = new Set<string>();
      const nextKeyValues = new Map<string, readonly unknown[]>();
      for (let i = 0; i < ranges.length; i += 1) {
        const { startRow, endRow } = ranges[i];
        if (startRow == null) continue; // eslint-disable-line no-continue
        const rEnd = endRow ?? startRow;
        const low = Math.min(startRow, rEnd);
        const high = Math.max(startRow, rEnd);
        for (let r = low; r <= high; r += 1) {
          const { key: k, values } = this.getRowKeyData(r);
          next.add(k);
          nextKeyValues.set(k, values);
        }
      }
      return new KeyedSelection({
        getModel: this.getModel,
        selectedKeys: next,
        selectedKeyValues: nextKeyValues,
      });
    }

    // Slow path: any row outside the viewport would resolve to a phantom
    // all-null key via undefined valueForCell reads. Defer to async key fetch;
    // IrisGrid's onSelectionChange handler picks up pendingRanges.
    return new KeyedSelection({
      getModel: this.getModel,
      pendingRanges: ranges,
    });
  }

  // Sets invertedSelection=true with an empty exclusion set (all rows selected).
  // eslint-disable-next-line class-methods-use-this
  selectAll(): KeyedSelection {
    return new KeyedSelection({
      getModel: this.getModel,
      invertedSelection: true,
    });
  }

  truncate(maxRows: number): KeyedSelection {
    if (maxRows === this.maxRows) return this;
    return this.copyWith({ maxRows });
  }

  /** Builds a fully-resolved selection from async-fetched key values, clearing pendingRanges. */
  resolve(keyValues: ReadonlyMap<string, readonly unknown[]>): KeyedSelection {
    return this.copyWith({
      selectedKeys: new Set(keyValues.keys()),
      overlayRanges: EMPTY_ARRAY,
      invertedSelection: false,
      lastSingleRow: null,
      selectedKeyValues: keyValues,
      maxRows: null,
      pendingRanges: EMPTY_ARRAY,
    });
  }

  /**
   * Returns the exact committed row count when each key maps to one row,
   * or null when the count is unknown (non-unique keys or pending resolution).
   * For inverted selections the count is approximate on ticking tables.
   */
  getUniqueRowCount(): number | null {
    if (
      this.pendingRanges.length > 0 ||
      !this.getModel().hasUniqueSelectionKeys
    ) {
      return null;
    }
    if (this.invertedSelection) {
      return this.getModel().rowCount - this.selectedKeys.size;
    }
    return this.selectedKeys.size;
  }

  /** Returns a new selection with the given row's key toggled. */
  withToggledRow(row: VisibleIndex): KeyedSelection {
    const { key, values } = this.getRowKeyData(row);
    const next = new Set(this.selectedKeys);
    const nextKeyValues = new Map(this.selectedKeyValues);
    if (next.has(key)) {
      next.delete(key);
      nextKeyValues.delete(key);
    } else {
      next.add(key);
      nextKeyValues.set(key, values);
    }
    return this.copyWith({
      selectedKeys: next,
      overlayRanges: EMPTY_ARRAY,
      lastSingleRow: null,
      selectedKeyValues: nextKeyValues,
      pendingRanges: EMPTY_ARRAY,
    });
  }
}

export default KeyedSelection;
