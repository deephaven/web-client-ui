import type GridRange from './GridRange';
import type GridModel from './GridModel';
import type { VisibleIndex } from './GridMetrics';

/** Provides current model data to Selection instances without holding a stale reference. */
export type GetModel = () => GridModel;

/**
 * Immutable value object representing the current selection state of the grid.
 * Mutations return new instances; Grid stores the result in React state.
 */
export interface Selection {
  isEmpty: () => boolean;
  isSelected: (row: VisibleIndex, column: VisibleIndex) => boolean;
  /** Returns true if the entire row is part of the selection (any column). */
  isRowSelected: (row: VisibleIndex) => boolean;
  /** Returns false if any selected range exceeds the given column/row bounds. */
  isValid: (columnCount: number, rowCount: number) => boolean;
  /** Returns the selection as GridRange[]. In keyed mode this synthesizes ranges. */
  toRanges: () => readonly GridRange[];
  /** Returns a new Selection with all ranges cleared. */
  cleared: () => Selection;
  /** Returns a new Selection keeping only the last range. */
  trimmed: () => Selection;
  /** Returns a new Selection with ranges replaced. */
  withUpdatedRanges: (ranges: readonly GridRange[]) => Selection;
}
