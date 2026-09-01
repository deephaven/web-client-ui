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

// ─── toRanges / toActiveRanges ───────────────────────────────────────────────

describe('toRanges and toActiveRanges', () => {
  it('return the same array reference as the internal ranges', () => {
    const ranges = [GridRange.makeCell(0, 0)];
    const sel = new RangedSelection(ranges, getModel);
    expect(sel.toRanges()).toBe(ranges);
    expect(sel.toActiveRanges()).toBe(ranges);
  });

  it('return empty array for empty selection', () => {
    expect(empty().toRanges()).toHaveLength(0);
    expect(empty().toActiveRanges()).toHaveLength(0);
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

// ─── withMouseGestureRanges ──────────────────────────────────────────────────

describe('withMouseGestureRanges', () => {
  it('behaves identically to withCommittedRanges', () => {
    const sel = single(0, 0);
    const newRanges = [GridRange.makeCell(2, 2)];
    const viaGesture = sel.withMouseGestureRanges(newRanges);
    const viaUpdated = sel.withCommittedRanges(newRanges);
    expect(viaGesture.toRanges()).toEqual(viaUpdated.toRanges());
  });

  it('preserves the gesture anchor', () => {
    const sel = single(0, 0).withGestureAnchor(3, 4);
    const updated = sel.withMouseGestureRanges([GridRange.makeCell(2, 2)]);
    expect(updated.getGestureAnchor()).toEqual({ row: 3, column: 4 });
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

  it('is preserved by commitMouseGesture', () => {
    const sel = single(1, 1).withGestureAnchor(2, 3);
    const committed = sel.commitMouseGesture(empty(), { autoSelectRow: false });
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

// ─── getLastSingleSelectedRow ────────────────────────────────────────────────

describe('getLastSingleSelectedRow', () => {
  it('returns null for empty selection', () => {
    expect(empty().getLastSingleSelectedRow()).toBeNull();
  });

  it('returns the row for a single-cell selection', () => {
    expect(single(3, 7).getLastSingleSelectedRow()).toBe(7);
  });

  it('returns the row for a full-row single-row selection', () => {
    expect(fullRow(4).getLastSingleSelectedRow()).toBe(4);
  });

  it('returns null when multiple rows are selected', () => {
    expect(range(0, 0, 0, 5).getLastSingleSelectedRow()).toBeNull();
  });

  it('returns null for multiple ranges', () => {
    const sel = new RangedSelection(
      [GridRange.makeCell(0, 0), GridRange.makeCell(1, 1)],
      getModel
    );
    expect(sel.getLastSingleSelectedRow()).toBeNull();
  });
});

// ─── commitMouseGesture ──────────────────────────────────────────────────────

describe('commitMouseGesture', () => {
  it('deselects when committing the same single cell over itself', () => {
    const last = single(3, 5);
    const current = single(3, 5);
    const result = current.commitMouseGesture(last, { autoSelectRow: false });
    expect(result.isEmpty()).toBe(true);
  });

  it('deselects when committing the same single row with autoSelectRow', () => {
    const last = fullRow(3);
    const current = fullRow(3);
    const result = current.commitMouseGesture(last, { autoSelectRow: true });
    expect(result.isEmpty()).toBe(true);
  });

  it('does NOT deselect a single row without autoSelectRow', () => {
    const last = fullRow(3);
    const current = fullRow(3);
    const result = current.commitMouseGesture(last, { autoSelectRow: false });
    expect(result.isEmpty()).toBe(false);
  });

  it('keeps a new single-cell selection when lastCommitted is empty', () => {
    const current = single(2, 4);
    const result = current.commitMouseGesture(empty(), {
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
    const result = combined.commitMouseGesture(outer, { autoSelectRow: false });
    // inner area should be cut out; result should not include (2,2)
    expect(result.isCellSelected(2, 2)).toBe(false);
    // outer areas outside inner should remain
    expect(result.isCellSelected(0, 0)).toBe(true);
  });

  it('consolidates adjacent ranges', () => {
    const a = new GridRange(0, 0, 0, 5);
    const b = new GridRange(0, 6, 0, 10);
    const sel = new RangedSelection([a, b], getModel);
    const result = sel.commitMouseGesture(empty(), { autoSelectRow: false });
    const ranges = result.toRanges();
    // Adjacent ranges [0,0-5] and [0,6-10] should consolidate to [0,0-10]
    expect(ranges).toHaveLength(1);
    expect(ranges[0]).toEqual(new GridRange(0, 0, 0, 10));
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
