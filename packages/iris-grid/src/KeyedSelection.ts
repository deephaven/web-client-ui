import { EMPTY_ARRAY } from '@deephaven/utils';
import type {
  BoundedAxisRange,
  GridRange,
  ModelIndex,
  Selection,
  VisibleIndex,
} from '@deephaven/grid';
import { RangedSelection } from '@deephaven/grid';
import type IrisGridModel from './IrisGridModel';
import type { KeyedGridModel } from './KeyedGridModel';

export type GetKeyedModel = () => IrisGridModel & KeyedGridModel;

export class KeyedSelection implements Selection {
  static empty(getModel: GetKeyedModel): KeyedSelection {
    return new KeyedSelection(getModel, new Set());
  }

  constructor(
    private readonly getModel: GetKeyedModel,
    readonly selectedKeys: ReadonlySet<string>,
    private readonly overlayRanges: readonly GridRange[] = EMPTY_ARRAY
  ) {}

  /** Visible row == model row in IrisGrid (sorting is server-side; no row moves). */
  private serializeRow(row: VisibleIndex): string {
    const model = this.getModel();
    const values = model.selectionKeyColumnIndices.map((col: ModelIndex) =>
      model.valueForCell(col, row)
    );
    return JSON.stringify(values);
  }

  isEmpty(): boolean {
    return this.selectedKeys.size === 0;
  }

  // Keyed selection is always full-row; column is irrelevant
  isCellSelected(row: VisibleIndex, _column: VisibleIndex): boolean {
    return this.isRowSelected(row);
  }

  isRowSelected(row: VisibleIndex): boolean {
    return this.selectedKeys.has(this.serializeRow(row));
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
    return EMPTY_ARRAY;
  }

  // eslint-disable-next-line class-methods-use-this
  getRowTickRanges(): readonly BoundedAxisRange[] {
    return EMPTY_ARRAY;
  }

  get mouseOverlaySelection(): RangedSelection | null {
    return this.overlayRanges.length > 0
      ? new RangedSelection(this.overlayRanges, this.getModel)
      : null;
  }

  withMouseGestureRanges(ranges: readonly GridRange[]): KeyedSelection {
    return new KeyedSelection(this.getModel, this.selectedKeys, ranges);
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
    if (this.selectedKeys.size > 0) {
      // Ctrl+click path: clearSelectedRanges was not called, so selectedKeys still
      // holds the previous committed keys. Toggle each overlay row individually.
      rows.forEach(r => {
        const k = this.serializeRow(r);
        if (lastCommitted.isRowSelected(r)) {
          next.delete(k);
        } else {
          next.add(k);
        }
      });
    } else {
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
    }
    return new KeyedSelection(this.getModel, next);
  }

  cleared(): KeyedSelection {
    return new KeyedSelection(this.getModel, new Set());
  }

  // Shift+click needs a clean slate so the range replaces rather than extends the old keys.
  trimmed(): KeyedSelection {
    return new KeyedSelection(this.getModel, new Set());
  }

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

  /** Returns a new selection with the given row's key toggled. */
  withToggledRow(row: VisibleIndex): KeyedSelection {
    const key = this.serializeRow(row);
    const next = new Set(this.selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    return new KeyedSelection(this.getModel, next);
  }
}

export default KeyedSelection;
