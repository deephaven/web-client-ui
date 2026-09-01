import type GridRange from './GridRange';
import type { GridRangeIndex } from './GridRange';
import type GridModel from './GridModel';
import type { VisibleIndex } from './GridMetrics';
import type { BoundedAxisRange } from './GridAxisRange';

/** Provides current model data to Selection instances without holding a stale reference. */
export type GetModel = () => GridModel;

/**
 * Options for `Selection.commitMouseGesture`.
 */
export type CommitMouseGestureOptions = {
  /**
   * When true, a single-row commit that repeats the previous single-row
   * selection is treated as a deselect (matches theme `autoSelectRow`
   * behavior).
   */
  autoSelectRow: boolean;
};

/**
 * Immutable value object representing the current selection state of the grid.
 * Mutations return new instances; Grid stores the result in React state.
 *
 * Two write paths cover selection updates:
 * - `withCommittedRanges` writes into the **committed** selection state
 *   (programmatic entry points like `Grid.setSelectedRanges`).
 * - `withMouseGestureRanges` writes into the **transient overlay** state
 *   used for mid-gesture rendering (drag / shift-click on every mouse move).
 *
 * For `RangedSelection` these look the same because there's no separate
 * overlay concept. For `KeyedSelection` they're distinct: overlay ranges
 * drive gesture preview only; committed key sets change on `commitMouseGesture`.
 */
export interface Selection extends SelectionQueries, SelectionTransforms {}

/** Read-only inspection of a `Selection`. Every method is side-effect-free. */
export interface SelectionQueries {
  /** True when the selection contains no cells and no in-progress gesture. */
  isEmpty: () => boolean;
  /** True when `(column, row)` is part of the selection. */
  isCellSelected: (column: VisibleIndex, row: VisibleIndex) => boolean;
  /** True when the entire row is part of the selection. */
  isRowSelected: (row: VisibleIndex) => boolean;
  /** True when the entire column is part of the selection. */
  isColumnSelected: (column: VisibleIndex) => boolean;
  /** False if any selected range exceeds the model's current column or row count. */
  isValid: () => boolean;
  /**
   * Ranges Grid uses for cursor positioning, extend-selection, and keyboard
   * navigation. For `RangedSelection` these are the committed ranges; for
   * `KeyedSelection` these are the transient overlay ranges (empty after commit).
   */
  toActiveRanges: () => readonly GridRange[];
  /** Column `[start, end]` pairs for scrollbar tick rendering. */
  getColumnTickRanges: () => readonly BoundedAxisRange[];
  /** Row `[start, end]` pairs for scrollbar tick rendering. */
  getRowTickRanges: () => readonly BoundedAxisRange[];
  /**
   * The single selected visible row, or `null` when zero or multiple rows
   * are selected. Drives `gotoRow` sync.
   */
  getLastSingleSelectedRow: () => VisibleIndex | null;
  /**
   * The current `{row, column}` of the gesture anchor, or `null` if none is
   * set or the anchor is no longer resolvable (e.g. a keyed anchor whose
   * row has scrolled out of the viewport with no row hint fallback).
   */
  getGestureAnchor: () => {
    row: GridRangeIndex;
    column: GridRangeIndex;
  } | null;
}

/**
 * Immutable transformations of a `Selection`. Each method returns a new
 * `Selection`; the receiver is never modified.
 */
export interface SelectionTransforms {
  /** A fresh empty selection with no committed state, overlay, or anchor. */
  clear: () => Selection;
  /**
   * A new selection keeping only the last committed range (for
   * `RangedSelection`) or clearing committed keys (for `KeyedSelection`).
   * Called by `Grid.trimSelectedRanges` immediately before shift-based
   * extend so the anchor is preserved.
   */
  trimmed: () => Selection;
  /**
   * Replaces the **committed** selection with the given ranges. Clears the
   * gesture anchor and any transient overlay state. Programmatic entry point
   * used by `Grid.setSelectedRanges`, `setFocusRow`, and
   * `moveCursorInDirection`.
   */
  withCommittedRanges: (ranges: readonly GridRange[]) => Selection;
  /**
   * Replaces the **transient overlay** ranges (mid-gesture preview) with
   * the given ranges. Called on every mouse-move during a drag / shift-click.
   * Preserves the gesture anchor. `commitMouseGesture` later folds the
   * overlay into the committed state.
   *
   * When `isReplacing` is true the caller intends the overlay to replace
   * the current committed selection (drag / shift+click). Implementations
   * that would otherwise carry previously-committed state (e.g.
   * `KeyedSelection.selectedKeys`) drop it. Ignored by `RangedSelection`.
   */
  withMouseGestureRanges: (
    ranges: readonly GridRange[],
    isReplacing?: boolean
  ) => Selection;
  /**
   * Commits the transient overlay into the committed selection and returns
   * the settled selection. Handles consolidation, deselect-on-reclick, and
   * subtract logic. Returns `this` (identity) when there is nothing to
   * commit, which lets `Grid.commitSelection` short-circuit its setState.
   */
  commitMouseGesture: (
    lastCommitted: Selection,
    options: CommitMouseGestureOptions
  ) => Selection;
  /** A new selection covering the entire grid. */
  selectAll: () => Selection;
  /** A new selection containing at most `maxRows` rows. */
  truncate: (maxRows: number) => Selection;
  /**
   * A new selection whose gesture anchor is set to the given cell. The
   * anchor is the extend-from position for shift-click and keyboard extend.
   * Called from `Grid.beginSelection` on a fresh mouse-down. Passing `null`
   * for both `row` and `column` clears the anchor.
   */
  withGestureAnchor: (row: GridRangeIndex, column: GridRangeIndex) => Selection;
}
