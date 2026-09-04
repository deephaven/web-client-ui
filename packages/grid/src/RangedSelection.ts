import { EMPTY_ARRAY, assertNotNaN, assertNotNull } from '@deephaven/utils';
import GridRange, {
  type GridRangeIndex,
  type SELECTION_DIRECTION,
} from './GridRange';
import type { VisibleIndex } from './GridMetrics';
import { type BoundedAxisRange } from './GridAxisRange';
import GridUtils from './GridUtils';
import type {
  CommitGestureOptions,
  GestureExtendOptions,
  GetModel,
  Selection,
  TickRangeSelection,
} from './Selection';
import {
  computeGestureExtend,
  cursorLandingCellForRanges,
  nextCursorInRanges,
  withCommittedCursor,
} from './GridSelectionUtils';

/**
 * Immutable `Selection` for standard (row-indexed) grids. Each entry in
 * `ranges` describes a rectangle of cells; consumers iterate/consolidate
 * as needed.
 */
export class RangedSelection implements Selection, TickRangeSelection {
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
    private readonly gestureStartColumn: GridRangeIndex = null,
    /** Focus row; null when no cursor is set. */
    readonly cursorRow: VisibleIndex | null = null,
    /** Focus column; null when no cursor is set. */
    readonly cursorColumn: VisibleIndex | null = null,
    /** Last shift/drag endpoint row; null when unset. */
    readonly selectionEndRow: VisibleIndex | null = null,
    /** Last shift/drag endpoint column; null when unset. */
    readonly selectionEndColumn: VisibleIndex | null = null
  ) {}

  /**
   * Returns a copy with the given fields overridden. Unspecified fields
   * carry through from `this`, so mutations that only touch ranges /
   * anchor keep cursor + endpoint intact without extra bookkeeping at
   * every call site.
   */
  private copyWith(overrides: {
    ranges?: readonly GridRange[];
    gestureStart?: { row: GridRangeIndex; column: GridRangeIndex };
    cursor?: { row: VisibleIndex | null; column: VisibleIndex | null };
    selectionEnd?: { row: VisibleIndex | null; column: VisibleIndex | null };
  }): RangedSelection {
    const gestureStart = overrides.gestureStart ?? {
      row: this.gestureStartRow,
      column: this.gestureStartColumn,
    };
    const cursor = overrides.cursor ?? {
      row: this.cursorRow,
      column: this.cursorColumn,
    };
    const selectionEnd = overrides.selectionEnd ?? {
      row: this.selectionEndRow,
      column: this.selectionEndColumn,
    };
    return new RangedSelection(
      overrides.ranges ?? this.ranges,
      this.getModel,
      gestureStart.row,
      gestureStart.column,
      cursor.row,
      cursor.column,
      selectionEnd.row,
      selectionEnd.column
    );
  }

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

  isColumnSelected(column: VisibleIndex): boolean {
    const { rowCount } = this.getModel();
    for (let i = 0; i < this.ranges.length; i += 1) {
      const range = this.ranges[i];
      const columnInRange =
        range.startColumn === null ||
        (range.startColumn <= column && column <= (range.endColumn ?? 0));
      const allRowsSelected =
        range.startRow === null ||
        (range.startRow === 0 && (range.endRow ?? -1) === rowCount - 1);
      if (columnInRange && allRowsSelected) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if all ranges are within the bounds of the grid model.
   * @returns True if all ranges are within bounds, false otherwise.
   */
  isInBounds(): boolean {
    const { columnCount, rowCount } = this.getModel();
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
    if (this.cachedColumnTickRanges !== undefined) {
      return this.cachedColumnTickRanges;
    }
    const raw: BoundedAxisRange[] = [];
    for (let i = 0; i < this.ranges.length; i += 1) {
      const { startColumn, endColumn } = this.ranges[i];
      if (startColumn != null && endColumn != null) {
        raw.push([startColumn, endColumn]);
      }
    }
    raw.sort(GridUtils.compareRanges);
    this.cachedColumnTickRanges = GridUtils.mergeSortedRanges(raw);
    return this.cachedColumnTickRanges;
  }

  getRowTickRanges(): readonly BoundedAxisRange[] {
    if (this.cachedRowTickRanges !== undefined) {
      return this.cachedRowTickRanges;
    }
    const raw: BoundedAxisRange[] = [];
    for (let i = 0; i < this.ranges.length; i += 1) {
      const { startRow, endRow } = this.ranges[i];
      if (startRow != null && endRow != null) {
        raw.push([startRow, endRow]);
      }
    }
    raw.sort(GridUtils.compareRanges);
    this.cachedRowTickRanges = GridUtils.mergeSortedRanges(raw);
    return this.cachedRowTickRanges;
  }

  private cachedColumnTickRanges: readonly BoundedAxisRange[] | undefined;

  private cachedRowTickRanges: readonly BoundedAxisRange[] | undefined;

  withCommittedRanges(
    ranges: readonly GridRange[],
    anchor?: { row: GridRangeIndex; column: GridRangeIndex }
  ): RangedSelection {
    const result =
      ranges === this.ranges
        ? this
        : this.copyWith({
            ranges,
            gestureStart: { row: null, column: null },
          });
    if (anchor === undefined) return result;
    return result.withGestureAnchor(anchor.row, anchor.column);
  }

  /**
   * Sets the gesture anchor (extend-from position for shift-click and
   * keyboard extend) to the given cell. Passing `null` for both clears it.
   */
  private withGestureAnchor(
    row: GridRangeIndex,
    column: GridRangeIndex
  ): RangedSelection {
    if (row === this.gestureStartRow && column === this.gestureStartColumn) {
      return this;
    }
    return this.copyWith({ gestureStart: { row, column } });
  }

  /**
   * The current `{row, column}` of the gesture anchor, or `null` if none is set.
   */
  private getGestureAnchor(): {
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

  isSingleRowSelection(): boolean {
    return GridRange.rowCount(this.ranges) === 1;
  }

  getNextCursorInDirection(
    current: { row: GridRangeIndex; column: GridRangeIndex },
    direction: SELECTION_DIRECTION
  ): { row: GridRangeIndex; column: GridRangeIndex } | null {
    const { columnCount, rowCount } = this.getModel();
    return nextCursorInRanges(this.ranges, current, direction, {
      columnCount,
      rowCount,
    });
  }

  getCursorLandingCell(): {
    row: GridRangeIndex;
    column: GridRangeIndex;
  } | null {
    const { columnCount, rowCount } = this.getModel();
    return cursorLandingCellForRanges(this.ranges, { columnCount, rowCount });
  }

  // eslint-disable-next-line class-methods-use-this
  resolveCursorRow(fallback: GridRangeIndex): GridRangeIndex {
    // Ranged selections do not drift with ticking, so the cursor row is always valid. Return the fallback.
    return fallback;
  }

  // eslint-disable-next-line class-methods-use-this
  resolveShiftEndpointRow(fallback: GridRangeIndex): GridRangeIndex {
    // Ranged selections do not drift with ticking, so the cursor row is always valid. Return the fallback.
    return fallback;
  }

  withCursor(
    row: VisibleIndex | null,
    column: VisibleIndex | null
  ): RangedSelection {
    if (row === this.cursorRow && column === this.cursorColumn) return this;
    return this.copyWith({ cursor: { row, column } });
  }

  withSelectionEnd(
    row: VisibleIndex | null,
    column: VisibleIndex | null
  ): RangedSelection {
    if (row === this.selectionEndRow && column === this.selectionEndColumn) {
      return this;
    }
    return this.copyWith({ selectionEnd: { row, column } });
  }

  withGestureExtend(
    cursor: { row: GridRangeIndex; column: GridRangeIndex },
    opts: GestureExtendOptions
  ): RangedSelection {
    const { newRanges, trimBefore, resetAnchor } = computeGestureExtend(
      this.ranges,
      this.getGestureAnchor(),
      cursor,
      opts
    );
    // Trim is a no-op wrapper for RangedSelection when `newRanges` already
    // reflects the single-remaining-range shape returned by computeGestureExtend,
    // but call it explicitly so anchor / other state stays consistent with the
    // existing shift-click path.
    const base = trimBefore ? this.trimmed() : this;
    let result: RangedSelection =
      newRanges === base.ranges ? base : base.copyWith({ ranges: newRanges });
    if (resetAnchor) {
      result = result.withGestureAnchor(cursor.row, cursor.column);
    }
    return result;
  }

  commitGesture(
    lastCommitted: Selection,
    opts: CommitGestureOptions
  ): RangedSelection {
    const { autoSelectRow } = opts;
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
      return withCommittedCursor(
        this.copyWith({ ranges: EMPTY_ARRAY }),
        this.getCursorLandingCell(),
        opts
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
    return withCommittedCursor(
      changed ? this.copyWith({ ranges: newRanges }) : this,
      this.getCursorLandingCell(),
      opts
    );
  }

  clear(): RangedSelection {
    return this.copyWith({
      ranges: EMPTY_ARRAY,
      gestureStart: { row: null, column: null },
      selectionEnd: { row: null, column: null },
    });
  }

  trimmed(): RangedSelection {
    if (this.ranges.length > 0) {
      return this.copyWith({
        ranges: this.ranges.slice(this.ranges.length - 1),
      });
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
    return this.copyWith({ ranges });
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
