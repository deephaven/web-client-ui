import type GridRange from './GridRange';
import type { GridRangeIndex } from './GridRange';
import type GridModel from './GridModel';
import type { VisibleIndex } from './GridMetrics';
import type { BoundedAxisRange } from './GridAxisRange';

/** Provides current model data to Selection instances without holding a stale reference. */
export type GetModel = () => GridModel;

/**
 * Immutable value object representing the current selection state of the grid.
 * Mutations return new instances; Grid stores the result in React state.
 */
export interface Selection {
  /** Returns true if no cells are selected. */
  isEmpty: () => boolean;
  /** Returns true if the specified cell is part of the selection. */
  isCellSelected: (row: VisibleIndex, column: VisibleIndex) => boolean;
  /** Returns true if the entire row is part of the selection. */
  isRowSelected: (row: VisibleIndex) => boolean;
  /** Returns false if any selected range exceeds the given column/row bounds. */
  isValid: (columnCount: number, rowCount: number) => boolean;
  /** Returns the ranges Grid uses for cursor positioning, extend-selection, and keyboard navigation. */
  toActiveRanges: () => readonly GridRange[];
  /** Returns column [start, end] pairs for scrollbar tick rendering. */
  getColumnTickRanges: () => readonly BoundedAxisRange[];
  /** Returns row [start, end] pairs for scrollbar tick rendering. */
  getRowTickRanges: () => readonly BoundedAxisRange[];
  /** Returns a new Selection with selection cleared. */
  clear: () => Selection;
  /** Returns a new Selection keeping only the last range. */
  trimmed: () => Selection;
  /** Returns a new Selection generated from the supplied ranges */
  withUpdatedRanges: (ranges: readonly GridRange[]) => Selection;
  /**
   * Applies mouse gesture ranges to this selection. When `isReplacing` is
   * true the caller intends the overlay to replace the current selection
   * (drag / shift+click); implementations that would otherwise carry
   * previously-committed selection state (e.g. `KeyedSelection.selectedKeys`)
   * should drop it. Ignored by `RangedSelection`.
   */
  withMouseGestureRanges: (
    ranges: readonly GridRange[],
    isReplacing?: boolean
  ) => Selection;
  /**
   * Commits the current mouse gesture and returns the settled selection.
   * Returns this (identity) when there is nothing to commit.
   */
  commitMouseGesture: (
    lastCommitted: Selection,
    autoSelectRow: boolean
  ) => Selection;
  /** Returns a new Selection representing the entire grid selected. */
  selectAll: () => Selection;
  /** Returns the single selected visible row, or null if zero or multiple rows are selected. */
  getLastSingleSelectedRow: () => VisibleIndex | null;
  /**
   * Returns a new Selection containing at most maxRows rows.
   */
  truncate: (maxRows: number) => Selection;
  /**
   * Returns a new Selection whose gesture anchor is set to the given cell.
   * The anchor is the extend-from position for shift-click. Passing null for
   * both row and column clears the anchor.
   */
  withGestureAnchor: (row: GridRangeIndex, column: GridRangeIndex) => Selection;
  /**
   * Returns the current row/column of the gesture anchor, or null if no
   * anchor is set or the anchor is no longer resolvable (e.g. a keyed
   * anchor whose row has scrolled out of the viewport).
   */
  getGestureAnchor: () => {
    row: GridRangeIndex;
    column: GridRangeIndex;
  } | null;
}
