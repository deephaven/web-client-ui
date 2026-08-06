import { EMPTY_ARRAY } from '@deephaven/utils';
import type GridRange from './GridRange';
import type { VisibleIndex } from './GridMetrics';
import { type BoundedAxisRange } from './GridAxisRange';
import type { GetModel, Selection } from './Selection';

/** Immutable selection implementation based on grid ranges. */
export class RangedSelection implements Selection {
  static empty(getModel: GetModel): RangedSelection {
    return new RangedSelection(EMPTY_ARRAY, getModel);
  }

  readonly usesMouseSelectionOverlay = false;

  constructor(
    readonly ranges: readonly GridRange[],
    private readonly getModel: GetModel
  ) {}

  isEmpty(): boolean {
    return this.ranges.length === 0;
  }

  isCellSelected(row: VisibleIndex, column: VisibleIndex): boolean {
    for (let i = 0; i < this.ranges.length; i += 1) {
      const range = this.ranges[i];
      const rowSelected =
        range.startRow === null ||
        (range.startRow <= row && row <= (range.endRow ?? 0));
      const columnSelected =
        range.startColumn === null ||
        (range.startColumn <= column && column <= (range.endColumn ?? 0));
      if (rowSelected && columnSelected) {
        return true;
      }
    }
    return false;
  }

  isRowSelected(row: VisibleIndex): boolean {
    const { columnCount } = this.getModel();
    for (let i = 0; i < this.ranges.length; i += 1) {
      const range = this.ranges[i];
      const rowInRange =
        range.startRow === null ||
        (range.startRow <= row && row <= (range.endRow ?? 0));
      const allColumnsSelected =
        range.startColumn === null ||
        (range.startColumn === 0 &&
          (range.endColumn ?? -1) === columnCount - 1);
      if (rowInRange && allColumnsSelected) {
        return true;
      }
    }
    return false;
  }

  isValid(columnCount: number, rowCount: number): boolean {
    for (let i = 0; i < this.ranges.length; i += 1) {
      const range = this.ranges[i];
      if (
        (range.endColumn != null && range.endColumn >= columnCount) ||
        (range.endRow != null && range.endRow >= rowCount)
      ) {
        return false;
      }
    }
    return true;
  }

  toRanges(): readonly GridRange[] {
    return this.ranges;
  }

  getColumnTickRanges(): readonly BoundedAxisRange[] {
    const result: BoundedAxisRange[] = [];
    for (let i = 0; i < this.ranges.length; i += 1) {
      const { startColumn, endColumn } = this.ranges[i];
      if (startColumn != null && endColumn != null) {
        result.push([startColumn, endColumn]);
      }
    }
    return result;
  }

  getRowTickRanges(): readonly BoundedAxisRange[] {
    const result: BoundedAxisRange[] = [];
    for (let i = 0; i < this.ranges.length; i += 1) {
      const { startRow, endRow } = this.ranges[i];
      if (startRow != null && endRow != null) {
        result.push([startRow, endRow]);
      }
    }
    return result;
  }

  withUpdatedRanges(ranges: readonly GridRange[]): RangedSelection {
    if (ranges === this.ranges) return this;
    return new RangedSelection(ranges, this.getModel);
  }

  // eslint-disable-next-line class-methods-use-this
  cleared(): RangedSelection {
    return new RangedSelection(EMPTY_ARRAY, this.getModel);
  }

  trimmed(): RangedSelection {
    if (this.ranges.length > 0) {
      return new RangedSelection(
        this.ranges.slice(this.ranges.length - 1),
        this.getModel
      );
    }
    return this;
  }
}

export default RangedSelection;
