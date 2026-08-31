import { EMPTY_ARRAY, assertNotNaN, assertNotNull } from '@deephaven/utils';
import GridRange, { type GridRangeIndex } from './GridRange';
import type { VisibleIndex } from './GridMetrics';
import { type BoundedAxisRange } from './GridAxisRange';
import type {
  CommitMouseGestureOptions,
  GetModel,
  Selection,
} from './Selection';

/**
 * Immutable `Selection` for standard (row-indexed) grids. Each entry in
 * `ranges` describes a rectangle of cells; consumers iterate/consolidate
 * as needed.
 */
export class RangedSelection implements Selection {
  static empty(getModel: GetModel): RangedSelection {
    return new RangedSelection(EMPTY_ARRAY, getModel);
  }

  constructor(
    /** Committed selection rectangles; may be empty for a cleared selection. */
    readonly ranges: readonly GridRange[],
    /**
     * Deferred lookup for the current `GridModel`. Passed as a closure
     * (not a direct reference) so this Selection always reads the model
     * currently on `Grid.props.model` — surviving prop swaps without
     * holding a stale reference.
     */
    private readonly getModel: GetModel,
    /** Anchor row for shift-click / keyboard extend; null when no anchor is set. */
    private readonly gestureStartRow: GridRangeIndex = null,
    /** Anchor column for shift-click / keyboard extend; null when no anchor is set. */
    private readonly gestureStartColumn: GridRangeIndex = null
  ) {}

  isEmpty(): boolean {
    return this.ranges.length === 0;
  }

  isCellSelected(column: VisibleIndex, row: VisibleIndex): boolean {
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

  toActiveRanges(): readonly GridRange[] {
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

  withCommittedRanges(ranges: readonly GridRange[]): RangedSelection {
    if (ranges === this.ranges) return this;
    return new RangedSelection(ranges, this.getModel);
  }

  // Preserves the gesture anchor so mid-drag range updates don't clobber the shift-click origin.
  withMouseGestureRanges(
    ranges: readonly GridRange[],
    _isReplacing?: boolean
  ): RangedSelection {
    // Identity check keeps the same object for commitMouseGesture's no-op path.
    // This allows Grid.commitSelection to recognize that no changes have occurred.
    if (ranges === this.ranges) return this;
    return new RangedSelection(
      ranges,
      this.getModel,
      this.gestureStartRow,
      this.gestureStartColumn
    );
  }

  withGestureAnchor(
    row: GridRangeIndex,
    column: GridRangeIndex
  ): RangedSelection {
    if (row === this.gestureStartRow && column === this.gestureStartColumn) {
      return this;
    }
    return new RangedSelection(this.ranges, this.getModel, row, column);
  }

  getGestureAnchor(): {
    row: GridRangeIndex;
    column: GridRangeIndex;
  } | null {
    if (this.gestureStartRow == null && this.gestureStartColumn == null) {
      return null;
    }
    return { row: this.gestureStartRow, column: this.gestureStartColumn };
  }

  selectAll(): RangedSelection {
    const { rowCount } = this.getModel();
    return this.withCommittedRanges([
      new GridRange(null, 0, null, rowCount - 1),
    ]);
  }

  getLastSingleSelectedRow(): VisibleIndex | null {
    const consolidated = GridRange.consolidate(this.ranges);
    if (GridRange.rowCount(consolidated) !== 1) return null;
    return consolidated[0]?.startRow ?? null;
  }

  commitMouseGesture(
    lastCommitted: Selection,
    { autoSelectRow }: CommitMouseGestureOptions
  ): RangedSelection {
    const selectedRanges = this.ranges;
    // lastCommitted is always a RangedSelection when this method is called
    assertIsRangedSelection(lastCommitted);
    const lastRanges = lastCommitted.toRanges();

    if (
      selectedRanges.length === 1 &&
      (autoSelectRow
        ? GridRange.rowCount(selectedRanges) === 1
        : GridRange.cellCount(selectedRanges) === 1) &&
      GridRange.rangeArraysEqual(selectedRanges, lastRanges)
    ) {
      return new RangedSelection(
        EMPTY_ARRAY,
        this.getModel,
        this.gestureStartRow,
        this.gestureStartColumn
      );
    }

    let newRanges = selectedRanges.slice();
    if (newRanges.length > 1) {
      const lastRange = newRanges[newRanges.length - 1];
      for (let i = 0; i < newRanges.length - 1; i += 1) {
        if (newRanges[i].contains(lastRange)) {
          const remainder = newRanges[i].subtract(lastRange);
          newRanges.pop();
          newRanges.splice(i, 1);
          newRanges = newRanges.concat(remainder);
          break;
        }
      }
      newRanges = GridRange.consolidate(newRanges);
    }

    const changed =
      newRanges.length !== selectedRanges.length ||
      newRanges.some((r, i) => !r.equals(selectedRanges[i]));
    return this.withMouseGestureRanges(changed ? newRanges : selectedRanges);
  }

  // eslint-disable-next-line class-methods-use-this
  clear(): RangedSelection {
    return new RangedSelection(EMPTY_ARRAY, this.getModel);
  }

  trimmed(): RangedSelection {
    if (this.ranges.length > 0) {
      return new RangedSelection(
        this.ranges.slice(this.ranges.length - 1),
        this.getModel,
        this.gestureStartRow,
        this.gestureStartColumn
      );
    }
    return this;
  }

  truncate(maxRows: number): RangedSelection {
    let rowCount = GridRange.rowCount(this.ranges);
    if (rowCount <= maxRows) return this;
    const ranges = [...this.ranges];
    while (rowCount > maxRows) {
      const lastRow = ranges.pop();
      // should never occur, sanity check
      assertNotNull(lastRow, 'Selected ranges should not be empty');
      const lastRowSize = GridRange.rowCount([lastRow]);
      // should never occur, sanity check
      assertNotNaN(lastRowSize, 'Selected ranges should not be unbounded');
      if (rowCount - lastRowSize < maxRows) {
        ranges.push(
          new GridRange(
            lastRow.startColumn,
            lastRow.startRow,
            lastRow.endColumn,
            (lastRow.endRow ?? 0) - (rowCount - maxRows)
          )
        );
        break;
      }
      rowCount -= lastRowSize;
    }
    return new RangedSelection(
      ranges,
      this.getModel,
      this.gestureStartRow,
      this.gestureStartColumn
    );
  }
}

export function isRangedSelection(
  selection: Selection
): selection is RangedSelection {
  return selection instanceof RangedSelection;
}

export function assertIsRangedSelection(
  selection: Selection
): asserts selection is RangedSelection {
  if (!(selection instanceof RangedSelection)) {
    throw new Error(
      `Expected a RangedSelection but got ${selection.constructor.name}`
    );
  }
}

/**
 * Returns `selection.toRanges()` when `selection` is a `RangedSelection`,
 * otherwise `EMPTY_ARRAY`. Handy for consumers that only care about the
 * range-form projection of a selection (e.g. legacy `selectedRanges`
 * callbacks) and want a stable empty array for keyed / null selections.
 */
export function selectionToRanges(
  selection: Selection | null | undefined
): readonly GridRange[] {
  return selection != null && isRangedSelection(selection)
    ? selection.toRanges()
    : EMPTY_ARRAY;
}

export default RangedSelection;
