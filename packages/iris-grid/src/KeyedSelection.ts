import { EMPTY_ARRAY, EMPTY_MAP } from '@deephaven/utils';
import type {
  BoundedAxisRange,
  GridRange,
  ModelIndex,
  Selection,
  VisibleIndex,
} from '@deephaven/grid';
import type IrisGridModel from './IrisGridModel';
import type { KeyedGridModel } from './KeyedGridModel';

export type GetKeyedModel = () => IrisGridModel & KeyedGridModel;

export class KeyedSelection implements Selection {
  static empty(getModel: GetKeyedModel): KeyedSelection {
    return new KeyedSelection(getModel, new Set());
  }

  private readonly gestureKeys: ReadonlySet<string>;

  constructor(
    private readonly getModel: GetKeyedModel,
    readonly selectedKeys: ReadonlySet<string>,
    private readonly overlayRanges: readonly GridRange[] = EMPTY_ARRAY,
    // When true, selectedKeys is an exclusion set: all rows are selected EXCEPT those in the set.
    readonly invertedSelection: boolean = false,
    // Last committed single-row position; best-effort, may be stale after table ticks.
    private readonly lastSingleRow: VisibleIndex | null = null,
    // Raw key-column values for each committed key; used for server-side filter construction.
    readonly selectedKeyValues: ReadonlyMap<
      string,
      readonly unknown[]
    > = EMPTY_MAP,
    // When non-null, limits snapshot results to this many rows via the viewport subscription.
    readonly maxRows: number | null = null
  ) {
    // Pre-serialize gesture rows so isRowSelected is O(1) and key-siblings are included immediately.
    if (overlayRanges.length === 0) {
      this.gestureKeys = new Set();
    } else {
      const keys = new Set<string>();
      for (let i = 0; i < overlayRanges.length; i += 1) {
        const { startRow, endRow } = overlayRanges[i];
        if (startRow == null) continue; // eslint-disable-line no-continue
        const last = endRow ?? startRow;
        for (let r = startRow; r <= last; r += 1) {
          keys.add(this.getRowKeyData(r).key);
        }
      }
      this.gestureKeys = keys;
    }
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
    return { key: JSON.stringify(values), values };
  }

  isEmpty(): boolean {
    // Inverted selection means all rows are selected — never empty.
    if (this.invertedSelection) return false;
    return this.selectedKeys.size === 0 && this.gestureKeys.size === 0;
  }

  // Keyed selection is always full-row; column is irrelevant
  isCellSelected(row: VisibleIndex, _column: VisibleIndex): boolean {
    return this.isRowSelected(row);
  }

  isRowSelected(row: VisibleIndex): boolean {
    const { key } = this.getRowKeyData(row);
    if (this.invertedSelection) return !this.selectedKeys.has(key);
    // Include gesture preview keys so key-siblings highlight on mousedown without waiting for commit.
    return this.selectedKeys.has(key) || this.gestureKeys.has(key);
  }

  // eslint-disable-next-line class-methods-use-this
  isValid(_columnCount: number, _rowCount: number): boolean {
    return true;
  }

  getLastSingleSelectedRow(): VisibleIndex | null {
    if (this.invertedSelection || this.selectedKeys.size !== 1) return null;
    return this.lastSingleRow;
  }

  toActiveRanges(): readonly GridRange[] {
    return this.overlayRanges;
  }

  // eslint-disable-next-line class-methods-use-this
  getColumnTickRanges(): readonly BoundedAxisRange[] {
    // Keyed selection does not support column-specific tick ranges.
    return EMPTY_ARRAY;
  }

  // eslint-disable-next-line class-methods-use-this
  getRowTickRanges(): readonly BoundedAxisRange[] {
    // Keyed selection does not support row-specific tick ranges.
    return EMPTY_ARRAY;
  }

  // Preserve invertedSelection through gesture overlay changes
  withMouseGestureRanges(ranges: readonly GridRange[]): KeyedSelection {
    return new KeyedSelection(
      this.getModel,
      this.selectedKeys,
      ranges,
      this.invertedSelection,
      null,
      this.selectedKeyValues
    );
  }

  commitMouseGesture(
    lastCommitted: Selection,
    _autoSelectRow: boolean
  ): KeyedSelection {
    if (this.overlayRanges.length === 0) return this;
    const rows: VisibleIndex[] = [];
    for (let i = 0; i < this.overlayRanges.length; i += 1) {
      const { startRow, endRow } = this.overlayRanges[i];
      if (startRow == null) continue; // eslint-disable-line no-continue
      const last = endRow ?? startRow;
      for (let r = startRow; r <= last; r += 1) {
        rows.push(r);
      }
    }
    if (rows.length === 0) return this;
    const next = new Set(this.selectedKeys);

    if (this.selectedKeys.size > 0 || this.invertedSelection) {
      // Ctrl+click path: clearSelectedRanges was not called, so selectedKeys still
      // holds the previous committed keys. Toggle each overlay row individually.
      const nextKeyValues = new Map(this.selectedKeyValues);
      rows.forEach(r => {
        const { key: k, values } = this.getRowKeyData(r);
        if (lastCommitted.isRowSelected(r)) {
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
      });
      return new KeyedSelection(
        this.getModel,
        next,
        EMPTY_ARRAY,
        this.invertedSelection,
        null,
        nextKeyValues
      );
    }

    // Regular click path: clearSelectedRanges emptied selectedKeys first.
    const rowKeyData = rows.map(r => this.getRowKeyData(r));
    const serialized = rowKeyData.map(({ key }) => key);
    const nextKeyValues = new Map(this.selectedKeyValues);
    // Deselect only when the overlay rows comprised the entire previous selection.
    // If lastCommitted had more rows, this is a "select only this row" gesture.
    const wasEntireSelection = lastCommitted
      .withUpdatedRanges(this.overlayRanges)
      .isEmpty();
    if (wasEntireSelection) {
      serialized.forEach(k => {
        next.delete(k);
        nextKeyValues.delete(k);
      });
    } else {
      rowKeyData.forEach(({ key: k, values }) => {
        next.add(k);
        nextKeyValues.set(k, values);
      });
    }
    // Store the single committed row so getLastSingleSelectedRow() works for gotoRow sync.
    const singleRow = next.size === 1 && rows.length === 1 ? rows[0] : null;
    return new KeyedSelection(
      this.getModel,
      next,
      EMPTY_ARRAY,
      false,
      singleRow,
      nextKeyValues
    );
  }

  clear(): KeyedSelection {
    return new KeyedSelection(this.getModel, new Set());
  }

  // Shift+click needs a clean slate so the range replaces rather than extends the old keys.
  trimmed(): KeyedSelection {
    return new KeyedSelection(this.getModel, new Set());
  }

  // Always returns non-inverted; switching to a new selection exits inverted mode.
  withUpdatedRanges(ranges: readonly GridRange[]): KeyedSelection {
    if (ranges.length === 0) return this;
    const rows: VisibleIndex[] = [];
    for (let i = 0; i < ranges.length; i += 1) {
      const { startRow, endRow } = ranges[i];
      if (startRow == null) continue; // eslint-disable-line no-continue
      const last = endRow ?? startRow;
      for (let r = startRow; r <= last; r += 1) {
        rows.push(r);
      }
    }
    if (rows.length === 0) return this;
    const rowKeyData = rows.map(r => this.getRowKeyData(r));
    const next = new Set(this.selectedKeys);
    const nextKeyValues = new Map(this.selectedKeyValues);
    // Toggle: if every row is already selected, remove them; otherwise add all.
    if (rowKeyData.every(({ key }) => next.has(key))) {
      rowKeyData.forEach(({ key: k }) => {
        next.delete(k);
        nextKeyValues.delete(k);
      });
    } else {
      rowKeyData.forEach(({ key: k, values }) => {
        next.add(k);
        nextKeyValues.set(k, values);
      });
    }
    return new KeyedSelection(
      this.getModel,
      next,
      EMPTY_ARRAY,
      false,
      null,
      nextKeyValues
    );
  }

  // Sets invertedSelection=true with an empty exclusion set (all rows selected).
  // eslint-disable-next-line class-methods-use-this
  selectAll(): KeyedSelection {
    return new KeyedSelection(this.getModel, new Set(), EMPTY_ARRAY, true);
  }

  truncate(maxRows: number): KeyedSelection {
    if (maxRows === this.maxRows) return this;
    return new KeyedSelection(
      this.getModel,
      this.selectedKeys,
      this.overlayRanges,
      this.invertedSelection,
      this.lastSingleRow,
      this.selectedKeyValues,
      maxRows
    );
  }

  /**
   * Returns the exact committed row count when each key maps to one row,
   * or null when the count is unknown (non-unique keys).
   * For inverted selections the count is approximate on ticking tables.
   */
  getUniqueRowCount(): number | null {
    if (!this.getModel().hasUniqueSelectionKeys) {
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
    return new KeyedSelection(
      this.getModel,
      next,
      EMPTY_ARRAY,
      this.invertedSelection,
      null,
      nextKeyValues
    );
  }
}

export default KeyedSelection;
