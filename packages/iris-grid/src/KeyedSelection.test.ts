import { GridRange } from '@deephaven/grid';
import { KeyedSelection, type GetKeyedModel } from './KeyedSelection';

// ─── model stub ──────────────────────────────────────────────────────────────
// Row N has a single key column whose value equals N, so key = JSON.stringify([N]).

const COLUMN_COUNT = 5;
const ROW_COUNT = 100;

const mockModel = {
  selectionKeyColumnIndices: [0] as readonly number[],
  hasUniqueSelectionKeys: true,
  columnCount: COLUMN_COUNT,
  rowCount: ROW_COUNT,
  valueForCell: (_col: number, row: number) => row,
  viewport: { top: 0, bottom: ROW_COUNT - 1 },
};

const getKeyedModel: GetKeyedModel = () => mockModel as never;

// ─── key helpers ─────────────────────────────────────────────────────────────

function keyOf(row: number): string {
  return JSON.stringify([row]);
}

function keyValuesOf(row: number): [string, readonly unknown[]] {
  return [keyOf(row), [row]];
}

// ─── factories ───────────────────────────────────────────────────────────────

function empty() {
  return KeyedSelection.empty(getKeyedModel);
}

/** A selection that contains exactly row 5. */
function singleRow(row = 5) {
  const key = keyOf(row);
  return new KeyedSelection(
    getKeyedModel,
    new Set([key]),
    [],
    false,
    row,
    new Map([[key, [row]]])
  );
}

/** A selection that contains rows 3 and 7. */
function multiRow() {
  return new KeyedSelection(
    getKeyedModel,
    new Set([keyOf(3), keyOf(7)]),
    [],
    false,
    null,
    new Map([keyValuesOf(3), keyValuesOf(7)])
  );
}

/** An inverted (select-all) selection with no exclusions. */
function allRows() {
  return new KeyedSelection(getKeyedModel, new Set(), [], true);
}

// ─── isEmpty ─────────────────────────────────────────────────────────────────

describe('isEmpty', () => {
  it('returns true when selectedKeys is empty and no overlay', () => {
    expect(empty().isEmpty()).toBe(true);
  });

  it('returns false when selectedKeys is non-empty', () => {
    expect(singleRow().isEmpty()).toBe(false);
  });

  it('returns false for inverted selection (pendingRows path)', () => {
    expect(allRows().isEmpty()).toBe(false);
  });

  it('returns false when pendingRows is set', () => {
    const pending = new KeyedSelection(
      getKeyedModel,
      new Set(),
      [],
      false,
      null,
      new Map(),
      null,
      new GridRange(null, 0, null, 10)
    );
    expect(pending.isEmpty()).toBe(false);
  });
});

// ─── isRowSelected / isCellSelected ──────────────────────────────────────────

describe('isRowSelected', () => {
  it('returns true for a row whose key is in selectedKeys', () => {
    expect(singleRow(5).isRowSelected(5)).toBe(true);
  });

  it('returns false for a row not in selectedKeys', () => {
    expect(singleRow(5).isRowSelected(6)).toBe(false);
  });

  it('returns true for any row in an inverted selection with no exclusions', () => {
    const all = allRows();
    expect(all.isRowSelected(0)).toBe(true);
    expect(all.isRowSelected(50)).toBe(true);
  });

  it('returns false for a row that is excluded in an inverted selection', () => {
    const excludeRow5 = new KeyedSelection(
      getKeyedModel,
      new Set([keyOf(5)]),
      [],
      true
    );
    expect(excludeRow5.isRowSelected(5)).toBe(false);
    expect(excludeRow5.isRowSelected(6)).toBe(true);
  });

  it('returns true for a row in the gesture overlay', () => {
    const withOverlay = new KeyedSelection(
      getKeyedModel,
      new Set(),
      [new GridRange(null, 3, null, 3)],
      false
    );
    expect(withOverlay.isRowSelected(3)).toBe(true);
    expect(withOverlay.isRowSelected(4)).toBe(false);
  });
});

describe('isCellSelected', () => {
  it('delegates to isRowSelected (column is irrelevant)', () => {
    const sel = singleRow(7);
    expect(sel.isCellSelected(7, 0)).toBe(true);
    expect(sel.isCellSelected(7, COLUMN_COUNT - 1)).toBe(true);
    expect(sel.isCellSelected(8, 0)).toBe(false);
  });
});

// ─── getLastSingleSelectedRow ─────────────────────────────────────────────────

describe('getLastSingleSelectedRow', () => {
  it('returns the row for a single-key selection with a lastSingleRow', () => {
    expect(singleRow(5).getLastSingleSelectedRow()).toBe(5);
  });

  it('returns null for a multi-key selection', () => {
    expect(multiRow().getLastSingleSelectedRow()).toBeNull();
  });

  it('returns null for an inverted selection', () => {
    expect(allRows().getLastSingleSelectedRow()).toBeNull();
  });

  it('returns null when selectedKeys.size !== 1', () => {
    expect(empty().getLastSingleSelectedRow()).toBeNull();
  });
});

// ─── selectAll ────────────────────────────────────────────────────────────────

describe('selectAll', () => {
  it('produces an inverted selection with no exclusions', () => {
    const all = empty().selectAll();
    expect(all.invertedSelection).toBe(true);
    expect(all.selectedKeys.size).toBe(0);
  });

  it('selects all rows', () => {
    const all = empty().selectAll();
    expect(all.isRowSelected(0)).toBe(true);
    expect(all.isRowSelected(ROW_COUNT - 1)).toBe(true);
  });
});

// ─── clear ────────────────────────────────────────────────────────────────────

describe('clear', () => {
  it('produces an empty selection', () => {
    expect(singleRow().clear().isEmpty()).toBe(true);
  });

  it('clears an inverted selection', () => {
    expect(allRows().clear().isEmpty()).toBe(true);
  });
});

// ─── trimmed ─────────────────────────────────────────────────────────────────

describe('trimmed', () => {
  it('returns an empty selection (always clears keys for shift-click reset)', () => {
    expect(singleRow().trimmed().isEmpty()).toBe(true);
    expect(multiRow().trimmed().isEmpty()).toBe(true);
  });
});

// ─── withUpdatedRanges ────────────────────────────────────────────────────────

describe('withUpdatedRanges', () => {
  it('selects a row that is not already selected', () => {
    const sel = empty().withUpdatedRanges([new GridRange(null, 3, null, 3)]);
    expect(sel.isRowSelected(3)).toBe(true);
  });

  it('replaces the selection — keeps a row already selected (no toggle)', () => {
    const sel = singleRow(3).withUpdatedRanges([
      new GridRange(null, 3, null, 3),
    ]);
    expect(sel.isRowSelected(3)).toBe(true);
  });

  it('returns an empty selection for empty ranges', () => {
    const sel = singleRow();
    expect(sel.withUpdatedRanges([]).isEmpty()).toBe(true);
  });
});

// ─── withMouseGestureRanges ───────────────────────────────────────────────────

describe('withMouseGestureRanges', () => {
  it('stores overlay ranges and keeps selectedKeys unchanged', () => {
    const sel = singleRow(2).withMouseGestureRanges([
      new GridRange(null, 5, null, 5),
    ]);
    // Row 2 still in selectedKeys
    expect(sel.selectedKeys.has(keyOf(2))).toBe(true);
    // Row 5 in gestureKeys via overlay
    expect(sel.isRowSelected(5)).toBe(true);
  });
});

// ─── truncate ────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('stores maxRows in the new instance', () => {
    const sel = singleRow().truncate(500);
    expect(sel.maxRows).toBe(500);
  });

  it('returns the same instance when maxRows is already set to the same value', () => {
    const sel = singleRow().truncate(500);
    expect(sel.truncate(500)).toBe(sel);
  });

  it('does not remove keys (resolution happens server-side via maxRows)', () => {
    const sel = multiRow().truncate(1);
    expect(sel.selectedKeys.size).toBe(2);
    expect(sel.maxRows).toBe(1);
  });
});

// ─── resolve ─────────────────────────────────────────────────────────────────

describe('resolve', () => {
  it('clears pendingRows and commits the provided key values', () => {
    const pending = new KeyedSelection(
      getKeyedModel,
      new Set(),
      [],
      false,
      null,
      new Map(),
      null,
      new GridRange(null, 0, null, 4)
    );
    const resolved = pending.resolve(new Map([keyValuesOf(0), keyValuesOf(2)]));
    expect(resolved.pendingRows).toBeNull();
    expect(resolved.isRowSelected(0)).toBe(true);
    expect(resolved.isRowSelected(2)).toBe(true);
    expect(resolved.isRowSelected(1)).toBe(false);
  });
});

// ─── getUniqueRowCount ────────────────────────────────────────────────────────

describe('getUniqueRowCount', () => {
  it('returns selectedKeys.size for a normal selection with unique keys', () => {
    expect(singleRow().getUniqueRowCount()).toBe(1);
    expect(multiRow().getUniqueRowCount()).toBe(2);
    expect(empty().getUniqueRowCount()).toBe(0);
  });

  it('returns rowCount - exclusions for an inverted selection', () => {
    // all rows selected → rowCount - 0 exclusions
    expect(allRows().getUniqueRowCount()).toBe(ROW_COUNT);

    // exclude row 5 → rowCount - 1
    const excludeOne = new KeyedSelection(
      getKeyedModel,
      new Set([keyOf(5)]),
      [],
      true
    );
    expect(excludeOne.getUniqueRowCount()).toBe(ROW_COUNT - 1);
  });

  it('returns null when pendingRows is set', () => {
    const pending = new KeyedSelection(
      getKeyedModel,
      new Set(),
      [],
      false,
      null,
      new Map(),
      null,
      new GridRange(null, 0, null, 9)
    );
    expect(pending.getUniqueRowCount()).toBeNull();
  });

  it('returns null when hasUniqueSelectionKeys is false', () => {
    const nonUniqueModel = { ...mockModel, hasUniqueSelectionKeys: false };
    const getModel: GetKeyedModel = () => nonUniqueModel as never;
    const sel = new KeyedSelection(
      getModel,
      new Set([keyOf(0)]),
      [],
      false,
      null,
      new Map([keyValuesOf(0)])
    );
    expect(sel.getUniqueRowCount()).toBeNull();
  });
});

// ─── commitMouseGesture (multi-row → pending) ─────────────────────────────────

describe('commitMouseGesture', () => {
  it('returns a pending selection when overlay spans more than one row', () => {
    const withOverlay = new KeyedSelection(
      getKeyedModel,
      new Set(),
      [new GridRange(null, 0, null, 5)],
      false
    );
    const result = withOverlay.commitMouseGesture(empty(), false);
    expect(result.pendingRows).not.toBeNull();
    expect(result.pendingRows?.startRow).toBe(0);
    expect(result.pendingRows?.endRow).toBe(5);
  });

  it('commits a single-row overlay synchronously', () => {
    const withOverlay = new KeyedSelection(
      getKeyedModel,
      new Set(),
      [new GridRange(null, 3, null, 3)],
      false
    );
    const result = withOverlay.commitMouseGesture(empty(), false);
    expect(result.pendingRows).toBeNull();
    expect(result.isRowSelected(3)).toBe(true);
  });

  it('deselects a single row when it was the entire previous selection', () => {
    const last = singleRow(3);
    const withOverlay = new KeyedSelection(
      getKeyedModel,
      new Set(),
      [new GridRange(null, 3, null, 3)],
      false
    );
    const result = withOverlay.commitMouseGesture(last, false);
    expect(result.isRowSelected(3)).toBe(false);
  });
});

// ─── withToggledRow ───────────────────────────────────────────────────────────

describe('withToggledRow', () => {
  it('adds a row that was not selected', () => {
    const sel = empty().withToggledRow(4);
    expect(sel.isRowSelected(4)).toBe(true);
  });

  it('removes a row that was already selected', () => {
    const sel = singleRow(4).withToggledRow(4);
    expect(sel.isRowSelected(4)).toBe(false);
  });

  it('preserves other selected rows when toggling a new one', () => {
    const sel = singleRow(2).withToggledRow(4);
    expect(sel.isRowSelected(2)).toBe(true);
    expect(sel.isRowSelected(4)).toBe(true);
  });
});
