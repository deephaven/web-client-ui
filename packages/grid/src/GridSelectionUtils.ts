import GridRange, { type GridRangeIndex } from './GridRange';
import type { GestureExtendOptions, GestureMode } from './Selection';

/**
 * Maps modifier-key state on a mouse event to the appropriate `GestureMode`.
 * The four modifier combinations partition the gesture space:
 * - shift + ctrl/meta → `maximize`
 * - shift alone       → `extend`
 * - ctrl/meta alone   → `add`
 * - no modifiers      → `replace`
 */
export function gestureModeFromModifiers(modifiers: {
  isShiftKey: boolean;
  isModifierKey: boolean;
}): GestureMode {
  const { isShiftKey, isModifierKey } = modifiers;
  if (isShiftKey && isModifierKey) return 'maximize';
  if (isShiftKey) return 'extend';
  if (isModifierKey) return 'add';
  return 'replace';
}

/**
 * Shape describing how a mouse gesture should mutate the selection's ranges.
 * Consumed by each `Selection` implementation's `withGestureExtend` to install
 * the transient overlay.
 */
export type GestureExtendResult = {
  /** The new range list to install as the transient overlay. */
  newRanges: readonly GridRange[];
  /**
   * True when the caller should drop any previously-committed selection state
   * (relevant to `KeyedSelection.selectedKeys`; ignored by `RangedSelection`).
   */
  isReplacing: boolean;
  /**
   * True when the caller should trim to the last committed range before
   * installing the new ranges. Applies to `extend` mode.
   */
  trimBefore: boolean;
  /**
   * True when the caller should reset the gesture anchor to `cursor` after
   * installing. False preserves the existing anchor.
   */
  resetAnchor: boolean;
};

/**
 * Compute the geometry for a mouse gesture. Given the current active ranges,
 * gesture anchor, cursor position, and mode, returns the new overlay ranges
 * plus the flags describing how the caller should install them.
 *
 * This is the shared arithmetic used by both `RangedSelection` and
 * `KeyedSelection` for their `withGestureExtend` implementations.
 */
export function computeGestureExtend(
  activeRanges: readonly GridRange[],
  anchor: { row: GridRangeIndex; column: GridRangeIndex } | null,
  cursor: { row: GridRangeIndex; column: GridRangeIndex },
  opts: GestureExtendOptions
): GestureExtendResult {
  const { mode, autoSelectRow, autoSelectColumn } = opts;
  const { row, column } = cursor;

  const singleCellColumn = autoSelectRow ? null : column;
  const singleCellRow = autoSelectColumn ? null : row;
  const singleCell = GridRange.makeNormalized(
    singleCellColumn,
    singleCellRow,
    singleCellColumn,
    singleCellRow
  );

  if (mode === 'replace') {
    return {
      newRanges: [singleCell],
      isReplacing: true,
      trimBefore: false,
      resetAnchor: true,
    };
  }

  if (mode === 'add') {
    return {
      newRanges: [...activeRanges, singleCell],
      isReplacing: false,
      trimBefore: false,
      resetAnchor: true,
    };
  }

  // extend or maximize — both extend an existing range from anchor/last-range.
  const trimBefore = mode === 'extend';
  const isReplacing = mode === 'extend';

  const rangesBeforeExtend =
    trimBefore && activeRanges.length > 0
      ? [activeRanges[activeRanges.length - 1]]
      : activeRanges;

  const anchorRow = anchor?.row ?? null;
  const anchorColumn = anchor?.column ?? null;

  // Nothing to extend from → fall through to replace-with-cell semantics.
  if (rangesBeforeExtend.length === 0 && anchor == null) {
    return {
      newRanges: [singleCell],
      isReplacing: true,
      trimBefore: false,
      resetAnchor: true,
    };
  }

  const lastRange =
    rangesBeforeExtend.length > 0
      ? rangesBeforeExtend[rangesBeforeExtend.length - 1]
      : GridRange.makeNormalized(
          anchorColumn,
          anchorRow,
          anchorColumn,
          anchorRow
        );

  let left: GridRangeIndex = null;
  let top: GridRangeIndex = null;
  let right: GridRangeIndex = null;
  let bottom: GridRangeIndex = null;

  if (mode === 'maximize') {
    left = autoSelectRow
      ? null
      : Math.min(column ?? 0, lastRange.startColumn ?? 0);
    top = autoSelectColumn ? null : Math.min(row ?? 0, lastRange.startRow ?? 0);
    right = autoSelectRow
      ? null
      : Math.max(column ?? 0, lastRange.endColumn ?? 0);
    bottom = autoSelectColumn
      ? null
      : Math.max(row ?? 0, lastRange.endRow ?? 0);
  } else {
    // extend — anchor to cursor, replacing the last range.
    left = lastRange.startColumn;
    top = lastRange.startRow;
    if (anchorColumn != null || anchorRow != null) {
      if (!autoSelectRow) left = anchorColumn;
      if (!autoSelectColumn) top = anchorRow;
    }
    right = autoSelectRow ? null : column;
    bottom = autoSelectColumn ? null : row;
  }

  const extended = GridRange.makeNormalized(left, top, right, bottom);

  if (lastRange.equals(extended)) {
    return {
      newRanges: rangesBeforeExtend,
      isReplacing,
      trimBefore,
      resetAnchor: false,
    };
  }

  const newRanges = [...rangesBeforeExtend];
  if (newRanges.length > 0) {
    newRanges[newRanges.length - 1] = extended;
  } else {
    newRanges.push(extended);
  }

  return {
    newRanges,
    isReplacing,
    trimBefore,
    resetAnchor: false,
  };
}
