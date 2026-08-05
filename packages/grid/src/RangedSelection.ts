import { EMPTY_ARRAY } from '@deephaven/utils';
import type GridRange from './GridRange';
import type { VisibleIndex } from './GridMetrics';
import type { Selection } from './Selection';

/**
 * Immutable selection implementation based on grid ranges.
 */
export class RangedSelection implements Selection {
  static readonly EMPTY = new RangedSelection(EMPTY_ARRAY);

  constructor(readonly ranges: readonly GridRange[]) {}

  isEmpty(): boolean {
    return this.ranges.length === 0;
  }

  isSelected(row: VisibleIndex, column: VisibleIndex): boolean {
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

  withUpdatedRanges(ranges: readonly GridRange[]): RangedSelection {
    if (ranges === this.ranges) return this;
    return new RangedSelection(ranges);
  }

  // eslint-disable-next-line class-methods-use-this
  cleared(): RangedSelection {
    return RangedSelection.EMPTY;
  }

  trimmed(): RangedSelection {
    if (this.ranges.length > 0) {
      return new RangedSelection(this.ranges.slice(this.ranges.length - 1));
    }
    return this;
  }
}

export default RangedSelection;
