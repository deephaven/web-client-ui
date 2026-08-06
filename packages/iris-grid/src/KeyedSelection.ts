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

  readonly usesMouseSelectionOverlay = true;

  constructor(
    private readonly getModel: GetKeyedModel,
    readonly selectedKeys: ReadonlySet<string>
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

  // eslint-disable-next-line class-methods-use-this
  getColumnTickRanges(): readonly BoundedAxisRange[] {
    // Keyed selection does not have column tick ranges
    return EMPTY_ARRAY;
  }

  // eslint-disable-next-line class-methods-use-this
  getRowTickRanges(): readonly BoundedAxisRange[] {
    // Keyed selection does not have row tick ranges
    return EMPTY_ARRAY;
  }

  cleared(): KeyedSelection {
    return new KeyedSelection(this.getModel, new Set());
  }

  // Trimming has no meaning for key-based selection
  trimmed(): KeyedSelection {
    return this;
  }

  // Range-based updates are ignored for keyed selection
  withUpdatedRanges(ranges: readonly GridRange[]): KeyedSelection {
    if (ranges.length === 0) return this;
    // Collect all visible rows from the ranges.
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
