import { EMPTY_ARRAY } from '@deephaven/utils';
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
    readonly invertedSelection: boolean = false
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
          keys.add(this.serializeRow(r));
        }
      }
      this.gestureKeys = keys;
    }
  }

  /** Visible row == model row in IrisGrid (sorting is server-side; no row moves). */
  private serializeRow(row: VisibleIndex): string {
    const model = this.getModel();
    const values = model.selectionKeyColumnIndices.map((col: ModelIndex) =>
      model.valueForCell(col, row)
    );
    return JSON.stringify(values);
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
    const k = this.serializeRow(row);
    if (this.invertedSelection) return !this.selectedKeys.has(k);
    // Include gesture preview keys so key-siblings highlight on mousedown without waiting for commit.
    return this.selectedKeys.has(k) || this.gestureKeys.has(k);
  }

  // eslint-disable-next-line class-methods-use-this
  isValid(_columnCount: number, _rowCount: number): boolean {
    return true;
  }

  // eslint-disable-next-line class-methods-use-this
  toRanges(): readonly GridRange[] {
    // TODO: synthesize ranges from selectedKeys for onSelectionChanged compat
    return EMPTY_ARRAY;
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
      this.invertedSelection
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
      rows.forEach(r => {
        const k = this.serializeRow(r);
        if (lastCommitted.isRowSelected(r)) {
          // Row was selected → deselect it: add to exclusion set (inverted) or remove from selected (normal)
          if (this.invertedSelection) next.add(k);
          else next.delete(k); // eslint-disable-line no-else-return
        } else if (this.invertedSelection) {
          next.delete(k); // remove from exclusion set
        } else {
          next.add(k); // add to selected set
        }
      });
      return new KeyedSelection(
        this.getModel,
        next,
        EMPTY_ARRAY,
        this.invertedSelection
      );
    }

    // Regular click path: clearSelectedRanges emptied selectedKeys first.
    const serialized = rows.map(r => this.serializeRow(r));
    // Deselect only when the overlay rows comprised the entire previous selection.
    // If lastCommitted had more rows, this is a "select only this row" gesture.
    const wasEntireSelection = lastCommitted
      .withUpdatedRanges(this.overlayRanges)
      .isEmpty();
    if (wasEntireSelection) {
      serialized.forEach(k => next.delete(k));
    } else {
      serialized.forEach(k => next.add(k));
    }
    return new KeyedSelection(this.getModel, next);
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
    const serialized = rows.map(r => this.serializeRow(r));
    const next = new Set(this.selectedKeys);
    // Toggle: if every row is already selected, remove them; otherwise add all.
    if (serialized.every(k => next.has(k))) {
      serialized.forEach(k => next.delete(k));
    } else {
      serialized.forEach(k => next.add(k));
    }
    return new KeyedSelection(this.getModel, next);
  }

  // Sets invertedSelection=true with an empty exclusion set (all rows selected).
  // eslint-disable-next-line class-methods-use-this
  selectAll(): KeyedSelection {
    return new KeyedSelection(this.getModel, new Set(), EMPTY_ARRAY, true);
  }

  /** Returns a new selection with the given row's key toggled. */
  withToggledRow(row: VisibleIndex): KeyedSelection {
    const key = this.serializeRow(row);
    const next = new Set(this.selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    return new KeyedSelection(
      this.getModel,
      next,
      EMPTY_ARRAY,
      this.invertedSelection
    );
  }
}

export default KeyedSelection;
