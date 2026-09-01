import type GridRange from './GridRange';
import type { GridRangeIndex } from './GridRange';
import type GridModel from './GridModel';
import type { VisibleIndex } from './GridMetrics';
import type { BoundedAxisRange } from './GridAxisRange';

/** Provides current model data to Selection instances without holding a stale reference. */
export type GetModel = () => GridModel;

/**
 * Options for the deprecated `commitMouseGesture`. Will be revisited when the
 * new `MouseSelection` / `KeyboardSelection` interfaces are introduced.
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
 * Composed from four sub-interfaces:
 * - `SelectionQueries` — read-only inspection.
 * - `SelectionTransforms` — immutable transforms with no external dependencies.
 * - `ProgrammaticSelection` — programmatic write path (`Grid.setSelectedRanges`).
 * - `SelectionDeprecated` — gesture-plumbing being replaced by upcoming
 *   `MouseSelection` / `KeyboardSelection` interfaces. See
 *   `plans/selection-interface-refactor.md`.
 */
export interface Selection
  extends SelectionQueries,
    SelectionTransforms,
    ProgrammaticSelection,
    SelectionDeprecated {}

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
  /**
   * The single selected visible row, or `null` when zero or multiple rows
   * are selected. Drives `gotoRow` sync.
   */
  getLastSingleSelectedRow: () => VisibleIndex | null;
}

/**
 * Optional capability implemented by selections that can project onto
 * scrollbar tick marks.
 */
export interface TickRangeSelection {
  /** Column `[start, end]` pairs for scrollbar tick rendering. */
  getColumnTickRanges: () => readonly BoundedAxisRange[];
  /** Row `[start, end]` pairs for scrollbar tick rendering. */
  getRowTickRanges: () => readonly BoundedAxisRange[];
}

export function isTickRangeSelection(
  selection: Selection
): selection is Selection & TickRangeSelection {
  return (
    typeof (selection as Partial<TickRangeSelection>).getColumnTickRanges ===
      'function' &&
    typeof (selection as Partial<TickRangeSelection>).getRowTickRanges ===
      'function'
  );
}

/**
 * Immutable transformations of a `Selection` that need no external context.
 * Each method returns a new `Selection`; the receiver is never modified.
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
  /** A new selection covering the entire grid. */
  selectAll: () => Selection;
  /** A new selection containing at most `maxRows` rows. */
  truncate: (maxRows: number) => Selection;
}

/**
 * Programmatic write path: install a caller-supplied set of ranges as the
 * committed selection. Used by `Grid.setSelectedRanges`, `setFocusRow`, and
 * `moveCursorInDirection`. Distinct from gesture-driven writes, which are
 * being reworked in the `MouseSelection` / `KeyboardSelection` interfaces.
 */
export interface ProgrammaticSelection {
  /**
   * Replaces the committed selection with the given ranges. Clears any
   * gesture anchor and transient overlay state.
   */
  withCommittedRanges: (ranges: readonly GridRange[]) => Selection;
}

/**
 * Members up for re-examination as part of the Selection interface refactor.
 * Consumers should treat these as unstable — they may move to
 * `MouseSelection` / `KeyboardSelection`, come back to `Selection` under
 * different names, or disappear entirely. See
 * `plans/selection-interface-refactor.md`.
 */
export interface SelectionDeprecated {
  /**
   * Ranges Grid uses for cursor positioning, extend-selection, and keyboard
   * navigation. For `RangedSelection` these are the committed ranges; for
   * `KeyedSelection` these are the transient overlay ranges (empty after commit).
   * @deprecated Use the new `MouseSelection` / `KeyboardSelection` primitives
   * once available.
   */
  toActiveRanges: () => readonly GridRange[];
  /**
   * The current `{row, column}` of the gesture anchor, or `null` if none is
   * set or the anchor is no longer resolvable (e.g. a keyed anchor whose
   * row has scrolled out of the viewport with no row hint fallback).
   * @deprecated Anchor state will become internal once gesture geometry
   * moves into Selection.
   */
  getGestureAnchor: () => {
    row: GridRangeIndex;
    column: GridRangeIndex;
  } | null;
  /**
   * Replaces the transient overlay ranges (mid-gesture preview) with the
   * given ranges. Called on every mouse-move during a drag / shift-click.
   * Preserves the gesture anchor. `commitMouseGesture` later folds the
   * overlay into the committed state.
   *
   * When `isReplacing` is true the caller intends the overlay to replace
   * the current committed selection (drag / shift+click). Implementations
   * that would otherwise carry previously-committed state (e.g.
   * `KeyedSelection.selectedKeys`) drop it. Ignored by `RangedSelection`.
   * @deprecated Will be replaced by higher-level `MouseSelection` primitives.
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
   * @deprecated Will be replaced by `MouseSelection.commitGesture` (name TBD).
   */
  commitMouseGesture: (
    lastCommitted: Selection,
    options: CommitMouseGestureOptions
  ) => Selection;
  /**
   * A new selection whose gesture anchor is set to the given cell. The
   * anchor is the extend-from position for shift-click and keyboard extend.
   * Called from `Grid.beginSelection` on a fresh mouse-down. Passing `null`
   * for both `row` and `column` clears the anchor.
   * @deprecated Anchor writes will become internal to gesture primitives.
   */
  withGestureAnchor: (row: GridRangeIndex, column: GridRangeIndex) => Selection;
}
