import type GridRange from './GridRange';
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
  /** Returns the selection as GridRange[]. In keyed mode this synthesizes ranges. */
  toRanges: () => readonly GridRange[];
  /**
   * Returns the ranges Grid uses for cursor positioning, extend-selection, and keyboard navigation.
   * RangedSelection: committed ranges (same as toRanges).
   * KeyedSelection: the pending overlay ranges during a gesture, empty otherwise.
   */
  toActiveRanges: () => readonly GridRange[];
  /** Returns column [start, end] pairs for scrollbar tick rendering. */
  getColumnTickRanges: () => readonly BoundedAxisRange[];
  /** Returns row [start, end] pairs for scrollbar tick rendering. */
  getRowTickRanges: () => readonly BoundedAxisRange[];
  /** Returns a new Selection with all ranges cleared. */
  cleared: () => Selection;
  /** Returns a new Selection keeping only the last range. */
  trimmed: () => Selection;
  /** Returns a new Selection with ranges replaced. */
  withUpdatedRanges: (ranges: readonly GridRange[]) => Selection;
  /**
   * In-progress mouse gesture overlay for rendering; null when there is no pending gesture.
   * RangedSelection: always null (committed state IS the in-progress state).
   * KeyedSelection: a RangedSelection built from the pending drag ranges.
   */
  readonly mouseOverlaySelection: Selection | null;
  /**
   * Applies mouse gesture ranges to this selection.
   * RangedSelection: commits the ranges immediately (same as withUpdatedRanges).
   * KeyedSelection: stores the ranges as a pending overlay without touching committed keys.
   */
  withMouseGestureRanges: (ranges: readonly GridRange[]) => Selection;
  /**
   * Commits the current mouse gesture and returns the settled selection.
   * RangedSelection: consolidates ranges, handles deselect-on-reclick and ctrl+click subtract.
   * KeyedSelection: converts the overlay ranges to key toggles.
   * Returns this (identity) when there is nothing to commit.
   */
  commitMouseGesture: (
    lastCommitted: Selection,
    autoSelectRow: boolean
  ) => Selection;
}
