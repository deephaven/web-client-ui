import type GridRange from './GridRange';
import type { GridRangeIndex, SELECTION_DIRECTION } from './GridRange';
import type GridModel from './GridModel';
import type { VisibleIndex } from './GridMetrics';
import type { BoundedAxisRange } from './GridAxisRange';

/** Provides current model data to Selection instances without holding a stale reference. */
export type GetModel = () => GridModel;

/**
 * Immutable value object representing the current selection state of the grid.
 * Mutations return new instances; Grid stores the result in React state.
 *
 * Composed from five sub-interfaces:
 * - `SelectionQueries` — read-only inspection.
 * - `SelectionTransforms` — immutable transforms with no external dependencies.
 * - `ProgrammaticSelection` — programmatic write path (`Grid.setSelectedRanges`).
 * - `MouseSelection` — mouse-driven gestures (click, shift-click, drag).
 * - `KeyboardSelection` — keyboard-driven queries (Tab/Enter advance, cursor
 *   landing after commit).
 */
export interface Selection
  extends SelectionQueries,
    SelectionTransforms,
    ProgrammaticSelection,
    MouseSelection,
    KeyboardSelection {}

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
   * True when the selection covers exactly one row.
   */
  isSingleRowSelection: () => boolean;
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
   * Replaces the committed selection with the given ranges and clears any
   * transient overlay state. When `anchor` is provided, sets the gesture
   * anchor (extend-from position for shift-click and keyboard extend) to
   * the given cell; otherwise clears it.
   */
  withCommittedRanges: (
    ranges: readonly GridRange[],
    anchor?: { row: GridRangeIndex; column: GridRangeIndex }
  ) => Selection;
}

/**
 * Modifier-key-derived mode for a mouse gesture:
 * - `replace` — plain click: clear the current selection and install a
 *   single cell at the cursor.
 * - `add` — ctrl/meta click: keep the current selection and add a single
 *   cell at the cursor.
 * - `extend` — shift click / drag: trim to the last range and extend it
 *   from the gesture anchor to the cursor.
 * - `maximize` — ctrl+shift click: keep all ranges, grow the last range
 *   to include the cursor.
 */
export type GestureMode = 'replace' | 'add' | 'extend' | 'maximize';

/** Options for `MouseSelection.withGestureExtend`. */
export type GestureExtendOptions = {
  /** How the current selection should be combined with the incoming cursor. */
  mode: GestureMode;
  /** Full-row selection mode (theme `autoSelectRow`). */
  autoSelectRow: boolean;
  /** Full-column selection mode (theme `autoSelectColumn`). */
  autoSelectColumn: boolean;
};

/** Options for `MouseSelection.commitGesture`. */
export type CommitGestureOptions = {
  /**
   * When true, a single-row commit that repeats the previous single-row
   * selection is treated as a deselect. Matches the `autoSelectRow` theme
   * flag semantic.
   */
  autoSelectRow: boolean;
};

/**
 * Mouse-driven selection updates. Both `withGestureExtend` and
 * `commitGesture` are called by `Grid`'s mouse handlers.
 *
 * A gesture starts on mouse-down, may extend across drag frames, and settles
 * on mouse-up. Each drag frame calls `withGestureExtend` to update the
 * transient overlay; `commitGesture` folds the overlay into the committed
 * selection.
 */
export interface MouseSelection {
  /**
   * Applies a mouse gesture that moves the selection to `cursor` per `opts`.
   * `mode` chooses replace / add / extend / maximize semantics based on the
   * modifier keys the caller observed.
   *
   * Returns a transient overlay-updated selection. Caller controls when to
   * `commitGesture` — mouse handlers commit on mouse-up only; a plain click
   * commits immediately.
   */
  withGestureExtend: (
    cursor: { row: GridRangeIndex; column: GridRangeIndex },
    opts: GestureExtendOptions
  ) => Selection;

  /**
   * Settles the current transient overlay into the committed selection.
   * Handles consolidation, deselect-on-reclick, and subtract logic. Returns
   * identity (`this`) when there is nothing to commit.
   *
   * `lastCommitted` is the selection state as it was BEFORE the current
   * gesture began. Grid pins this in state at gesture-start so the
   * deselect-on-reclick comparison stays stable across drag frames.
   */
  commitGesture: (
    lastCommitted: Selection,
    opts: CommitGestureOptions
  ) => Selection;
}

/**
 * Keyboard-driven selection queries. Grid's key handlers use these to advance
 * the cursor within the current selection (Tab/Enter) and to place the cursor
 * after a commit or programmatic install.
 */
export interface KeyboardSelection {
  /**
   * Returns the next cursor cell in `direction` starting from `current`.
   * When the selection is empty or has exactly one cell, walks the whole
   * grid (wrapping at edges) so a lone Tab still moves the cursor.
   * Otherwise cycles through the currently selected ranges.
   */
  getNextCursorInDirection: (
    current: { row: GridRangeIndex; column: GridRangeIndex },
    direction: SELECTION_DIRECTION
  ) => { row: GridRangeIndex; column: GridRangeIndex } | null;

  /**
   * Returns the cell the cursor should land on after this selection is
   * committed or programmatically installed. Grid calls this on the
   * pre-commit selection so `KeyedSelection`'s overlay is still available.
   * Returns `null` when the selection has no cells.
   */
  getCursorLandingCell: () => {
    row: GridRangeIndex;
    column: GridRangeIndex;
  } | null;

  /**
   * Tries to find the cursor row for a selection that may have moved due to ticking.
   *
   * @param fallback returned if the current cursor row cannot be determined.
   */
  resolveCursorRow: (fallback: GridRangeIndex) => GridRangeIndex;

  /**
   * Tries to find the shift endpoint row for a selection that may have moved due to ticking.
   *
   * @param fallback returned if the current shift endpoint row cannot be determined.
   */
  resolveShiftEndpointRow: (fallback: GridRangeIndex) => GridRangeIndex;
}
