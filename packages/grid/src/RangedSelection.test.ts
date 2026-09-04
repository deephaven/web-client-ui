import GridRange from './GridRange';
import {
  RangedSelection,
  isRangedSelection,
  assertIsRangedSelection,
} from './RangedSelection';
import type { GetModel } from './Selection';

const COLUMN_COUNT = 10;
const ROW_COUNT = 100;

function makeGetModel(
  columnCount = COLUMN_COUNT,
  rowCount = ROW_COUNT
): GetModel {
  return () => ({ columnCount, rowCount }) as never;
}

const getModel = makeGetModel();

// ─── factories ───────────────────────────────────────────────────────────────

function empty() {
  return RangedSelection.empty(getModel);
}

function single(col: number, row: number) {
  return new RangedSelection([GridRange.makeCell(col, row)], getModel);
}

function range(c1: number, r1: number, c2: number, r2: number) {
  return new RangedSelection([new GridRange(c1, r1, c2, r2)], getModel);
}

function fullRow(row: number) {
  return new RangedSelection([new GridRange(null, row, null, row)], getModel);
}

function fullColumn(col: number) {
  return new RangedSelection([new GridRange(col, null, col, null)], getModel);
}

// ─── isEmpty ─────────────────────────────────────────────────────────────────

describe('isEmpty', () => {
  it('returns true for empty selection', () => {
    expect(empty().isEmpty()).toBe(true);
  });

  it('returns false for a single-cell selection', () => {
    expect(single(0, 0).isEmpty()).toBe(false);
  });

  it('returns false for a multi-range selection', () => {
    const sel = new RangedSelection(
      [GridRange.makeCell(0, 0), GridRange.makeCell(1, 1)],
      getModel
    );
    expect(sel.isEmpty()).toBe(false);
  });
});

// ─── isCellSelected ──────────────────────────────────────────────────────────

describe('isCellSelected', () => {
  it('returns false for empty selection', () => {
    expect(empty().isCellSelected(0, 0)).toBe(false);
  });

  it('returns true for an exactly matching single-cell range', () => {
    expect(single(3, 5).isCellSelected(3, 5)).toBe(true);
  });

  it('returns false for a cell outside the single-cell range', () => {
    expect(single(3, 5).isCellSelected(3, 6)).toBe(false);
    expect(single(3, 5).isCellSelected(4, 5)).toBe(false);
  });

  it('handles null column bounds (full-row range)', () => {
    const sel = fullRow(3);
    expect(sel.isCellSelected(0, 3)).toBe(true);
    expect(sel.isCellSelected(COLUMN_COUNT - 1, 3)).toBe(true);
    expect(sel.isCellSelected(0, 4)).toBe(false);
  });

  it('handles null row bounds (full-column range)', () => {
    const sel = new RangedSelection(
      [new GridRange(2, null, 2, null)],
      getModel
    );
    expect(sel.isCellSelected(2, 0)).toBe(true);
    expect(sel.isCellSelected(2, ROW_COUNT - 1)).toBe(true);
    expect(sel.isCellSelected(3, 0)).toBe(false);
  });

  it('matches cells within a multi-cell range', () => {
    const sel = range(1, 2, 3, 4);
    expect(sel.isCellSelected(2, 2)).toBe(true);
    expect(sel.isCellSelected(3, 4)).toBe(true);
    expect(sel.isCellSelected(1, 1)).toBe(false);
    expect(sel.isCellSelected(4, 1)).toBe(false);
  });

  it('returns true if any range in a multi-range selection matches', () => {
    const sel = new RangedSelection(
      [GridRange.makeCell(0, 0), GridRange.makeCell(5, 5)],
      getModel
    );
    expect(sel.isCellSelected(0, 0)).toBe(true);
    expect(sel.isCellSelected(5, 5)).toBe(true);
    expect(sel.isCellSelected(1, 1)).toBe(false);
  });
});

// ─── isRowSelected ───────────────────────────────────────────────────────────

describe('isRowSelected', () => {
  it('returns false for empty selection', () => {
    expect(empty().isRowSelected(0)).toBe(false);
  });

  it('returns true when null column bounds span the row', () => {
    expect(fullRow(3).isRowSelected(3)).toBe(true);
    expect(fullRow(3).isRowSelected(4)).toBe(false);
  });

  it('returns true when explicit column bounds cover [0, columnCount-1]', () => {
    const sel = range(0, 5, COLUMN_COUNT - 1, 5);
    expect(sel.isRowSelected(5)).toBe(true);
  });

  it('returns false when column bounds do not cover the full row', () => {
    const sel = range(0, 5, COLUMN_COUNT - 2, 5);
    expect(sel.isRowSelected(5)).toBe(false);
  });
});

// ─── isColumnSelected ────────────────────────────────────────────────────────

describe('isColumnSelected', () => {
  it('returns false for empty selection', () => {
    expect(empty().isColumnSelected(0)).toBe(false);
  });

  it('returns true when null row bounds span the column', () => {
    expect(fullColumn(3).isColumnSelected(3)).toBe(true);
    expect(fullColumn(3).isColumnSelected(4)).toBe(false);
  });

  it('returns true when explicit row bounds cover [0, rowCount-1]', () => {
    const sel = range(5, 0, 5, ROW_COUNT - 1);
    expect(sel.isColumnSelected(5)).toBe(true);
  });

  it('returns false when row bounds do not cover the full column', () => {
    const sel = range(5, 0, 5, ROW_COUNT - 2);
    expect(sel.isColumnSelected(5)).toBe(false);
  });
});

// ─── isInBounds ─────────────────────────────────────────────────────────────

describe('isInBounds', () => {
  it('returns true for empty selection', () => {
    expect(empty().isInBounds()).toBe(true);
  });

  it('returns true when all ranges are within bounds', () => {
    expect(range(0, 0, 5, 10).isInBounds()).toBe(true);
  });

  it('returns false when a range exceeds columnCount', () => {
    expect(range(0, 0, COLUMN_COUNT, 0).isInBounds()).toBe(false);
  });

  it('returns false when a range exceeds rowCount', () => {
    expect(range(0, 0, 0, ROW_COUNT).isInBounds()).toBe(false);
  });

  it('returns true for null bounds (unbounded ranges are always valid)', () => {
    expect(fullRow(5).isInBounds()).toBe(true);
  });
});

// ─── toRanges ────────────────────────────────────────────────────────────────

describe('toRanges', () => {
  it('returns the same array reference as the internal ranges', () => {
    const ranges = [GridRange.makeCell(0, 0)];
    const sel = new RangedSelection(ranges, getModel);
    expect(sel.toRanges()).toBe(ranges);
  });

  it('returns empty array for empty selection', () => {
    expect(empty().toRanges()).toHaveLength(0);
  });
});

// ─── getColumnTickRanges ─────────────────────────────────────────────────────

describe('getColumnTickRanges', () => {
  it('returns empty for an empty selection', () => {
    expect(empty().getColumnTickRanges()).toHaveLength(0);
  });

  it('returns empty for a full-row range (null column bounds)', () => {
    expect(fullRow(5).getColumnTickRanges()).toHaveLength(0);
  });

  it('returns a tick range for each bounded column range', () => {
    const sel = new RangedSelection(
      [new GridRange(2, 0, 5, 0), new GridRange(7, 0, 9, 0)],
      getModel
    );
    expect(sel.getColumnTickRanges()).toEqual([
      [2, 5],
      [7, 9],
    ]);
  });
});

// ─── getRowTickRanges ────────────────────────────────────────────────────────

describe('getRowTickRanges', () => {
  it('returns empty for an empty selection', () => {
    expect(empty().getRowTickRanges()).toHaveLength(0);
  });

  it('returns a tick range for each bounded row range', () => {
    const sel = new RangedSelection(
      [new GridRange(0, 3, 0, 7), new GridRange(0, 10, 0, 15)],
      getModel
    );
    expect(sel.getRowTickRanges()).toEqual([
      [3, 7],
      [10, 15],
    ]);
  });
});

// ─── withCommittedRanges ───────────────────────────────────────────────────────

describe('withCommittedRanges', () => {
  it('returns the same instance when given the same ranges reference', () => {
    const sel = single(0, 0);
    expect(sel.withCommittedRanges(sel.toRanges())).toBe(sel);
  });

  it('returns a new instance with the new ranges', () => {
    const sel = single(0, 0);
    const newRanges = [GridRange.makeCell(1, 1)];
    const updated = sel.withCommittedRanges(newRanges);
    expect(updated).not.toBe(sel);
    expect(updated.toRanges()).toBe(newRanges);
  });
});

// ─── withGestureAnchor / getGestureAnchor ────────────────────────────────────

describe('getGestureAnchor', () => {
  it('returns null when no anchor was set', () => {
    expect(empty().getGestureAnchor()).toBeNull();
  });

  it('round-trips row and column through withGestureAnchor', () => {
    const sel = empty().withGestureAnchor(7, 3);
    expect(sel.getGestureAnchor()).toEqual({ row: 7, column: 3 });
  });

  it('returns identity when the anchor is unchanged', () => {
    const sel = empty().withGestureAnchor(1, 2);
    expect(sel.withGestureAnchor(1, 2)).toBe(sel);
  });

  it('clears the anchor when both row and column are null', () => {
    const sel = empty().withGestureAnchor(1, 2).withGestureAnchor(null, null);
    expect(sel.getGestureAnchor()).toBeNull();
  });

  it('returns the anchor when only row is set', () => {
    expect(empty().withGestureAnchor(5, null).getGestureAnchor()).toEqual({
      row: 5,
      column: null,
    });
  });

  it('is cleared by withCommittedRanges (fresh replacement)', () => {
    const sel = single(0, 0)
      .withGestureAnchor(3, 4)
      .withCommittedRanges([GridRange.makeCell(1, 1)]);
    expect(sel.getGestureAnchor()).toBeNull();
  });

  it('is preserved by commitGesture', () => {
    const sel = single(1, 1).withGestureAnchor(2, 3);
    const committed = sel.commitGesture(empty(), { autoSelectRow: false });
    expect(committed.getGestureAnchor()).toEqual({ row: 2, column: 3 });
  });

  it('is preserved by trimmed()', () => {
    const sel = new RangedSelection(
      [GridRange.makeCell(0, 0), GridRange.makeCell(1, 1)],
      getModel
    ).withGestureAnchor(5, 6);
    expect(sel.trimmed().getGestureAnchor()).toEqual({ row: 5, column: 6 });
  });
});

// ─── selectAll ───────────────────────────────────────────────────────────────

describe('selectAll', () => {
  it('selects all rows with null column bounds', () => {
    const sel = empty().selectAll();
    expect(sel.toRanges()).toEqual([
      new GridRange(null, 0, null, ROW_COUNT - 1),
    ]);
  });

  it('uses the current model row count', () => {
    const customRowCount = 50;
    const sel = RangedSelection.empty(
      makeGetModel(COLUMN_COUNT, customRowCount)
    );
    expect(sel.selectAll().toRanges()).toEqual([
      new GridRange(null, 0, null, customRowCount - 1),
    ]);
  });
});

// ─── commitGesture ───────────────────────────────────────────────────

describe('commitGesture', () => {
  it('deselects when committing the same single cell over itself', () => {
    const last = single(3, 5);
    const current = single(3, 5);
    const result = current.commitGesture(last, { autoSelectRow: false });
    expect(result.isEmpty()).toBe(true);
  });

  it('deselects when committing the same single row with autoSelectRow', () => {
    const last = fullRow(3);
    const current = fullRow(3);
    const result = current.commitGesture(last, { autoSelectRow: true });
    expect(result.isEmpty()).toBe(true);
  });

  it('does NOT deselect a single row without autoSelectRow', () => {
    const last = fullRow(3);
    const current = fullRow(3);
    const result = current.commitGesture(last, { autoSelectRow: false });
    expect(result.isEmpty()).toBe(false);
  });

  it('does NOT deselect when allowDeselect is false (keyboard callers)', () => {
    const last = single(3, 5);
    const current = single(3, 5);
    const result = current.commitGesture(last, {
      autoSelectRow: false,
      allowDeselect: false,
    });
    expect(result.isEmpty()).toBe(false);
    expect(result.toRanges()).toEqual(current.toRanges());
  });

  it('does NOT deselect a repeat single-row commit when allowDeselect is false', () => {
    const last = fullRow(3);
    const current = fullRow(3);
    const result = current.commitGesture(last, {
      autoSelectRow: true,
      allowDeselect: false,
    });
    expect(result.isEmpty()).toBe(false);
  });

  it('keeps a new single-cell selection when lastCommitted is empty', () => {
    const current = single(2, 4);
    const result = current.commitGesture(empty(), {
      autoSelectRow: false,
    });
    expect(result.toRanges()).toEqual(current.toRanges());
  });

  it('subtracts an overlapping range from a previous range (ctrl+click)', () => {
    const outer = range(0, 0, 5, 5);
    const inner = range(1, 1, 3, 3);
    // inner is already contained in outer; committing inner subtracts it
    const combined = new RangedSelection(
      [...outer.toRanges(), ...inner.toRanges()],
      getModel
    );
    const result = combined.commitGesture(outer, { autoSelectRow: false });
    // inner area should be cut out; result should not include (2,2)
    expect(result.isCellSelected(2, 2)).toBe(false);
    // outer areas outside inner should remain
    expect(result.isCellSelected(0, 0)).toBe(true);
  });

  it('consolidates adjacent ranges', () => {
    const a = new GridRange(0, 0, 0, 5);
    const b = new GridRange(0, 6, 0, 10);
    const sel = new RangedSelection([a, b], getModel);
    const result = sel.commitGesture(empty(), { autoSelectRow: false });
    const ranges = result.toRanges();
    // Adjacent ranges [0,0-5] and [0,6-10] should consolidate to [0,0-10]
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toEqual(new GridRange(0, 0, 0, 10));
  });
});

// ─── withGestureExtend (MouseSelection) ──────────────────────────────────────

describe('withGestureExtend', () => {
  const defaultOpts = { autoSelectRow: false, autoSelectColumn: false };

  describe('replace mode', () => {
    it('replaces the selection with a single cell at the cursor', () => {
      const sel = range(0, 0, 5, 5).withGestureExtend(
        { row: 10, column: 10 },
        { mode: 'replace', ...defaultOpts }
      );
      expect(sel.toRanges()).toHaveLength(1);
      expect(sel.toRanges()[0]).toEqual(GridRange.makeCell(10, 10));
    });

    it('resets the anchor to the cursor', () => {
      const sel = empty().withGestureExtend(
        { row: 10, column: 5 },
        { mode: 'replace', ...defaultOpts }
      );
      expect(sel.getGestureAnchor()).toEqual({ row: 10, column: 5 });
    });

    it('installs a full-row range when autoSelectRow is true', () => {
      const sel = empty().withGestureExtend(
        { row: 10, column: 5 },
        { mode: 'replace', autoSelectRow: true, autoSelectColumn: false }
      );
      expect(sel.toRanges()[0]).toEqual(new GridRange(null, 10, null, 10));
    });

    it('installs a full-column range when autoSelectColumn is true', () => {
      const sel = empty().withGestureExtend(
        { row: 10, column: 5 },
        { mode: 'replace', autoSelectRow: false, autoSelectColumn: true }
      );
      expect(sel.toRanges()[0]).toEqual(new GridRange(5, null, 5, null));
    });
  });

  describe('add mode', () => {
    it('appends a single cell to the existing ranges', () => {
      const sel = range(0, 0, 5, 5).withGestureExtend(
        { row: 10, column: 10 },
        { mode: 'add', ...defaultOpts }
      );
      expect(sel.toRanges()).toHaveLength(2);
      expect(sel.toRanges()[1]).toEqual(GridRange.makeCell(10, 10));
    });

    it('resets the anchor to the cursor', () => {
      const sel = single(3, 3)
        .withGestureAnchor(3, 3)
        .withGestureExtend(
          { row: 10, column: 10 },
          { mode: 'add', ...defaultOpts }
        );
      expect(sel.getGestureAnchor()).toEqual({ row: 10, column: 10 });
    });
  });

  describe('extend mode', () => {
    it('extends from the anchor to the cursor as a single range', () => {
      const sel = single(3, 3)
        .withGestureAnchor(3, 3)
        .withGestureExtend(
          { row: 7, column: 5 },
          { mode: 'extend', ...defaultOpts }
        );
      expect(sel.toRanges()).toHaveLength(1);
      expect(sel.toRanges()[0]).toEqual(new GridRange(3, 3, 5, 7));
    });

    it('preserves the anchor', () => {
      const sel = single(3, 3)
        .withGestureAnchor(3, 3)
        .withGestureExtend(
          { row: 7, column: 5 },
          { mode: 'extend', ...defaultOpts }
        );
      expect(sel.getGestureAnchor()).toEqual({ row: 3, column: 3 });
    });

    it('trims to the last range before extending', () => {
      const multi = new RangedSelection(
        [new GridRange(0, 0, 1, 1), new GridRange(5, 5, 6, 6)],
        getModel,
        6,
        6
      );
      const sel = multi.withGestureExtend(
        { row: 8, column: 8 },
        { mode: 'extend', ...defaultOpts }
      );
      expect(sel.toRanges()).toHaveLength(1);
      // Anchor is (6,6), cursor is (8,8), so extended range is (6,6,8,8).
      expect(sel.toRanges()[0]).toEqual(new GridRange(6, 6, 8, 8));
    });
  });

  describe('maximize mode', () => {
    it('grows the last range to include the cursor', () => {
      const sel = range(2, 2, 4, 4).withGestureExtend(
        { row: 6, column: 6 },
        { mode: 'maximize', ...defaultOpts }
      );
      expect(sel.toRanges()[0]).toEqual(new GridRange(2, 2, 6, 6));
    });

    it('preserves earlier ranges', () => {
      const multi = new RangedSelection(
        [new GridRange(0, 0, 1, 1), new GridRange(5, 5, 6, 6)],
        getModel
      );
      const sel = multi.withGestureExtend(
        { row: 8, column: 8 },
        { mode: 'maximize', ...defaultOpts }
      );
      expect(sel.toRanges()).toHaveLength(2);
      expect(sel.toRanges()[0]).toEqual(new GridRange(0, 0, 1, 1));
      expect(sel.toRanges()[1]).toEqual(new GridRange(5, 5, 8, 8));
    });

    it('preserves the anchor', () => {
      const sel = single(3, 3)
        .withGestureAnchor(3, 3)
        .withGestureExtend(
          { row: 7, column: 5 },
          { mode: 'maximize', ...defaultOpts }
        );
      expect(sel.getGestureAnchor()).toEqual({ row: 3, column: 3 });
    });
  });
});

// ─── KeyboardSelection ───────────────────────────────────────────────────────

describe('getCursorLandingCell', () => {
  it('returns null when the selection is empty', () => {
    expect(empty().getCursorLandingCell()).toBeNull();
  });

  it('returns the first cell of a single-cell selection', () => {
    expect(single(3, 4).getCursorLandingCell()).toEqual({ column: 3, row: 4 });
  });

  it('returns the top-left cell of a multi-cell range', () => {
    expect(range(2, 5, 7, 9).getCursorLandingCell()).toEqual({
      column: 2,
      row: 5,
    });
  });

  it('bounds unbounded ranges (full row) to the model column count', () => {
    expect(fullRow(3).getCursorLandingCell()).toEqual({ column: 0, row: 3 });
  });
});

describe('getNextCursorInDirection', () => {
  const { DOWN, RIGHT, UP } = GridRange.SELECTION_DIRECTION;

  it('walks the whole grid when the selection is empty', () => {
    expect(
      empty().getNextCursorInDirection({ column: 0, row: 0 }, RIGHT)
    ).toEqual({ column: 1, row: 0 });
  });

  it('walks the whole grid when only a single cell is selected', () => {
    expect(
      single(2, 3).getNextCursorInDirection({ column: 2, row: 3 }, DOWN)
    ).toEqual({ column: 2, row: 4 });
  });

  it('wraps at the grid edge when a single cell is at the bottom-right', () => {
    expect(
      single(COLUMN_COUNT - 1, ROW_COUNT - 1).getNextCursorInDirection(
        { column: COLUMN_COUNT - 1, row: ROW_COUNT - 1 },
        RIGHT
      )
    ).toEqual({ column: 0, row: 0 });
  });

  it('cycles through cells within a multi-cell range', () => {
    // range covers (2..4, 5..7); moving right from (2,5) advances to (3,5)
    expect(
      range(2, 5, 4, 7).getNextCursorInDirection({ column: 2, row: 5 }, RIGHT)
    ).toEqual({ column: 3, row: 5 });
  });

  it('wraps within a multi-cell range', () => {
    // moving UP from (2,5) inside range (2..4, 5..7) wraps to (4, 7)
    expect(
      range(2, 5, 4, 7).getNextCursorInDirection({ column: 2, row: 5 }, UP)
    ).toEqual({ column: 4, row: 7 });
  });
});

// ─── clear ───────────────────────────────────────────────────────────────────

describe('clear', () => {
  it('returns an empty selection', () => {
    expect(single(0, 0).clear().isEmpty()).toBe(true);
  });

  it('returns an empty selection from an already-empty selection', () => {
    expect(empty().clear().isEmpty()).toBe(true);
  });
});

// ─── trimmed ─────────────────────────────────────────────────────────────────

describe('trimmed', () => {
  it('returns the same instance for an empty selection', () => {
    const sel = empty();
    expect(sel.trimmed()).toBe(sel);
  });

  it('returns an equivalent selection for a single-range selection', () => {
    const sel = single(0, 0);
    expect(sel.trimmed().toRanges()).toEqual(sel.toRanges());
  });

  it('keeps only the last range from a multi-range selection', () => {
    const sel = new RangedSelection(
      [
        GridRange.makeCell(0, 0),
        GridRange.makeCell(3, 3),
        GridRange.makeCell(7, 7),
      ],
      getModel
    );
    const trimmed = sel.trimmed();
    expect(trimmed.toRanges()).toHaveLength(1);
    expect(trimmed.toRanges()[0]).toEqual(GridRange.makeCell(7, 7));
  });
});

// ─── truncate ────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('returns the same instance when already within maxRows', () => {
    const sel = range(0, 0, 0, 4); // 5 rows
    expect(sel.truncate(10)).toBe(sel);
    expect(sel.truncate(5)).toBe(sel);
  });

  it('truncates a single range to the max row count', () => {
    const sel = range(0, 0, 0, 9); // 10 rows
    const result = sel.truncate(5);
    expect(GridRange.rowCount(result.toRanges())).toBe(5);
    expect(result.toRanges()[0]).toEqual(new GridRange(0, 0, 0, 4));
  });

  it('removes entire trailing ranges that exceed maxRows', () => {
    const sel = new RangedSelection(
      [
        new GridRange(0, 0, 0, 4), // 5 rows
        new GridRange(0, 10, 0, 14), // 5 rows → total 10
      ],
      getModel
    );
    const result = sel.truncate(5);
    expect(GridRange.rowCount(result.toRanges())).toBe(5);
    expect(result.toRanges()).toHaveLength(1);
  });

  it('partially trims the last range when it straddles the limit', () => {
    const sel = new RangedSelection(
      [
        new GridRange(0, 0, 0, 2), // 3 rows
        new GridRange(0, 10, 0, 14), // 5 rows → total 8
      ],
      getModel
    );
    const result = sel.truncate(5); // need to trim 3 rows from the second range
    expect(GridRange.rowCount(result.toRanges())).toBe(5);
    expect(result.toRanges()[1]).toEqual(new GridRange(0, 10, 0, 11));
  });
});

// ─── cursor tracking ─────────────────────────────────────────────────────────

describe('cursor', () => {
  it('defaults to null on an empty selection', () => {
    expect(empty().cursorRow).toBeNull();
    expect(empty().cursorColumn).toBeNull();
  });

  it('stores the cursor position set via withCursor', () => {
    const sel = empty().withCursor(3, 5);
    expect(sel.cursorRow).toBe(3);
    expect(sel.cursorColumn).toBe(5);
  });

  it('returns identity when withCursor is a no-op', () => {
    const sel = empty().withCursor(3, 5);
    expect(sel.withCursor(3, 5)).toBe(sel);
  });

  it('clears when withCursor is called with null', () => {
    const sel = empty().withCursor(3, 5).withCursor(null, null);
    expect(sel.cursorRow).toBeNull();
    expect(sel.cursorColumn).toBeNull();
  });

  it('is preserved through withCommittedRanges', () => {
    const sel = empty()
      .withCursor(2, 4)
      .withCommittedRanges([GridRange.makeCell(0, 0)]);
    expect(sel.cursorRow).toBe(2);
    expect(sel.cursorColumn).toBe(4);
  });

  it('is preserved through commitGesture', () => {
    const sel = single(1, 1).withCursor(1, 1);
    const committed = sel.commitGesture(empty(), { autoSelectRow: false });
    expect(committed.cursorRow).toBe(1);
    expect(committed.cursorColumn).toBe(1);
  });

  it('is preserved through trimmed', () => {
    const sel = new RangedSelection(
      [GridRange.makeCell(0, 0), GridRange.makeCell(1, 1)],
      getModel
    ).withCursor(5, 6);
    expect(sel.trimmed().cursorRow).toBe(5);
    expect(sel.trimmed().cursorColumn).toBe(6);
  });

  it('is preserved through truncate', () => {
    const sel = range(0, 0, 0, 10).withCursor(0, 3);
    expect(sel.truncate(3).cursorRow).toBe(0);
    expect(sel.truncate(3).cursorColumn).toBe(3);
  });

  it('is preserved through clear', () => {
    const sel = single(0, 0).withCursor(2, 2).clear();
    expect(sel.cursorRow).toBe(2);
    expect(sel.cursorColumn).toBe(2);
    expect(sel.isEmpty()).toBe(true);
  });
});

// ─── selectionEnd tracking ───────────────────────────────────────────────────

describe('selectionEnd', () => {
  it('defaults to null on an empty selection', () => {
    expect(empty().selectionEndRow).toBeNull();
    expect(empty().selectionEndColumn).toBeNull();
  });

  it('stores the endpoint set via withSelectionEnd', () => {
    const sel = empty().withSelectionEnd(7, 3);
    expect(sel.selectionEndRow).toBe(7);
    expect(sel.selectionEndColumn).toBe(3);
  });

  it('returns identity when withSelectionEnd is a no-op', () => {
    const sel = empty().withSelectionEnd(7, 3);
    expect(sel.withSelectionEnd(7, 3)).toBe(sel);
  });

  it('clears when withSelectionEnd is called with null', () => {
    const sel = empty().withSelectionEnd(7, 3).withSelectionEnd(null, null);
    expect(sel.selectionEndRow).toBeNull();
    expect(sel.selectionEndColumn).toBeNull();
  });

  it('is preserved through withCommittedRanges', () => {
    const sel = empty()
      .withSelectionEnd(4, 2)
      .withCommittedRanges([GridRange.makeCell(0, 0)]);
    expect(sel.selectionEndRow).toBe(4);
    expect(sel.selectionEndColumn).toBe(2);
  });

  it('is preserved through commitGesture', () => {
    const sel = single(1, 1).withSelectionEnd(1, 1);
    const committed = sel.commitGesture(empty(), { autoSelectRow: false });
    expect(committed.selectionEndRow).toBe(1);
    expect(committed.selectionEndColumn).toBe(1);
  });

  it('is cleared by clear() (transient state)', () => {
    const sel = single(0, 0).withSelectionEnd(3, 3).clear();
    expect(sel.selectionEndRow).toBeNull();
    expect(sel.selectionEndColumn).toBeNull();
  });
});

// ─── isRangedSelection ───────────────────────────────────────────────────────

describe('isRangedSelection', () => {
  it('returns true for a RangedSelection', () => {
    expect(isRangedSelection(empty())).toBe(true);
  });

  it('returns false for a non-RangedSelection', () => {
    const fakeSelection = { isEmpty: () => true } as never;
    expect(isRangedSelection(fakeSelection)).toBe(false);
  });
});

// ─── assertIsRangedSelection ─────────────────────────────────────────────────

describe('assertIsRangedSelection', () => {
  it('does not throw for a RangedSelection', () => {
    expect(() => assertIsRangedSelection(empty())).not.toThrow();
  });

  it('throws for a non-RangedSelection', () => {
    const fakeSelection = { constructor: { name: 'Fake' } } as never;
    expect(() => assertIsRangedSelection(fakeSelection)).toThrow();
  });
});
