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
  return new KeyedSelection({
    getModel: getKeyedModel,
    selectedKeys: new Set([key]),
    selectedKeyValues: new Map([[key, [row]]]),
  });
}

/** A selection that contains rows 3 and 7. */
function multiRow() {
  return new KeyedSelection({
    getModel: getKeyedModel,
    selectedKeys: new Set([keyOf(3), keyOf(7)]),
    selectedKeyValues: new Map([keyValuesOf(3), keyValuesOf(7)]),
  });
}

/** An inverted (select-all) selection with no exclusions. */
function allRows() {
  return new KeyedSelection({
    getModel: getKeyedModel,
    invertedSelection: true,
  });
}

// ─── isEmpty ─────────────────────────────────────────────────────────────────

describe('isEmpty', () => {
  it('returns true when selectedKeys is empty and no overlay', () => {
    expect(empty().isEmpty()).toBe(true);
  });

  it('returns false when selectedKeys is non-empty', () => {
    expect(singleRow().isEmpty()).toBe(false);
  });

  it('returns false for inverted selection (pendingRanges path)', () => {
    expect(allRows().isEmpty()).toBe(false);
  });

  it('returns false when pendingRanges is non-empty', () => {
    const pending = new KeyedSelection({
      getModel: getKeyedModel,
      pendingRanges: [new GridRange(null, 0, null, 10)],
    });
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
    const excludeRow5 = new KeyedSelection({
      getModel: getKeyedModel,
      selectedKeys: new Set([keyOf(5)]),
      invertedSelection: true,
    });
    expect(excludeRow5.isRowSelected(5)).toBe(false);
    expect(excludeRow5.isRowSelected(6)).toBe(true);
  });

  it('returns true for a row in the gesture overlay', () => {
    const withOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 3, null, 3)],
    });
    expect(withOverlay.isRowSelected(3)).toBe(true);
    expect(withOverlay.isRowSelected(4)).toBe(false);
  });
});

describe('isCellSelected', () => {
  it('delegates to isRowSelected (column is irrelevant)', () => {
    const sel = singleRow(7);
    expect(sel.isCellSelected(0, 7)).toBe(true);
    expect(sel.isCellSelected(COLUMN_COUNT - 1, 7)).toBe(true);
    expect(sel.isCellSelected(0, 8)).toBe(false);
  });
});

describe('isColumnSelected', () => {
  it('returns true only for an inverted-empty (select-all) selection', () => {
    expect(allRows().isColumnSelected(0)).toBe(true);
    expect(allRows().isColumnSelected(COLUMN_COUNT - 1)).toBe(true);
  });

  it('returns false for a non-inverted selection even with keys', () => {
    expect(singleRow(5).isColumnSelected(0)).toBe(false);
    expect(empty().isColumnSelected(0)).toBe(false);
  });

  it('returns false for an inverted selection with exclusions', () => {
    const excludeOne = new KeyedSelection({
      getModel: getKeyedModel,
      selectedKeys: new Set([keyOf(5)]),
      invertedSelection: true,
    });
    expect(excludeOne.isColumnSelected(0)).toBe(false);
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

// ─── withCommittedRanges ────────────────────────────────────────────────────────

describe('withCommittedRanges', () => {
  afterEach(() => {
    mockModel.viewport = { top: 0, bottom: ROW_COUNT - 1 };
  });

  it('selects a row that is not already selected', () => {
    const sel = empty().withCommittedRanges([new GridRange(null, 3, null, 3)]);
    expect(sel.isRowSelected(3)).toBe(true);
  });

  it('replaces the selection — keeps a row already selected (no toggle)', () => {
    const sel = singleRow(3).withCommittedRanges([
      new GridRange(null, 3, null, 3),
    ]);
    expect(sel.isRowSelected(3)).toBe(true);
  });

  it('returns an empty selection for empty ranges', () => {
    const sel = singleRow();
    expect(sel.withCommittedRanges([]).isEmpty()).toBe(true);
  });

  it('resolves synchronously when all rows are in the viewport', () => {
    mockModel.viewport = { top: 0, bottom: 10 };
    const sel = empty().withCommittedRanges([new GridRange(null, 2, null, 5)]);
    expect(sel.pendingRanges).toHaveLength(0);
    expect(sel.selectedKeys.size).toBe(4);
    for (let r = 2; r <= 5; r += 1) {
      expect(sel.isRowSelected(r)).toBe(true);
    }
  });

  it('defers to async resolution when any row is out of viewport', () => {
    // Programmatic entry (e.g. Grid.setFocusRow jumping to row 50) must not
    // synchronously call valueForCell for rows outside the current viewport —
    // it returns undefined and collapses every off-screen row to the same
    // phantom [null,...] key.
    mockModel.viewport = { top: 0, bottom: 10 };
    const sel = empty().withCommittedRanges([
      new GridRange(null, 50, null, 50),
    ]);
    expect(sel.pendingRanges).toHaveLength(1);
    expect(sel.pendingRanges[0].startRow).toBe(50);
    expect(sel.pendingRanges[0].endRow).toBe(50);
    expect(sel.selectedKeys.size).toBe(0);
  });

  it('preserves multiple non-contiguous ranges in pendingRanges', () => {
    // Programmatic selection of rows 1 and 100 must NOT collapse into a
    // 1..100 envelope — otherwise resolveKeyedSelection would fetch and
    // select every intermediate row.
    mockModel.viewport = { top: 0, bottom: 10 };
    const sel = empty().withCommittedRanges([
      new GridRange(null, 1, null, 1),
      new GridRange(null, 100, null, 100),
    ]);
    expect(sel.pendingRanges).toHaveLength(2);
    expect(sel.pendingRanges[0].startRow).toBe(1);
    expect(sel.pendingRanges[1].startRow).toBe(100);
  });

  it('preserves reverse-ordered ranges without inverting endpoints', () => {
    // A reverse-order input must not create a malformed
    // GridRange(startRow=100, endRow=1) envelope; each input range is kept
    // as-is and resolveKeyedSelection handles ordering.
    mockModel.viewport = { top: 0, bottom: 10 };
    const sel = empty().withCommittedRanges([
      new GridRange(null, 100, null, 100),
      new GridRange(null, 1, null, 1),
    ]);
    expect(sel.pendingRanges).toHaveLength(2);
    expect(sel.pendingRanges[0].startRow).toBe(100);
    expect(sel.pendingRanges[1].startRow).toBe(1);
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

  it('drops selectedKeys / invertedSelection when isReplacing is true', () => {
    // Simulates a drag step from a committed single-key selection: the overlay
    // should replace rather than merge with the prior committed keys.
    const sel = singleRow(2).withMouseGestureRanges(
      [new GridRange(null, 5, null, 5)],
      true
    );
    expect(sel.selectedKeys.size).toBe(0);
    expect(sel.selectedKeyValues.size).toBe(0);
    expect(sel.invertedSelection).toBe(false);
    // Overlay still previews via gestureKeys.
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

// ─── cursor tracking ─────────────────────────────────────────────────────────

describe('cursor', () => {
  it('defaults to null on an empty selection', () => {
    expect(empty().cursorRow).toBeNull();
    expect(empty().cursorColumn).toBeNull();
  });

  it('stores cursor via withCursor', () => {
    const sel = empty().withCursor(2, 3);
    expect(sel.cursorRow).toBe(2);
    expect(sel.cursorColumn).toBe(3);
  });

  it('returns identity when withCursor is a no-op', () => {
    const sel = empty().withCursor(2, 3);
    expect(sel.withCursor(2, 3)).toBe(sel);
  });

  it('clears when withCursor is called with null', () => {
    const sel = empty().withCursor(2, 3).withCursor(null, null);
    expect(sel.cursorRow).toBeNull();
    expect(sel.cursorColumn).toBeNull();
  });

  it('resolves cursorKey against the current viewport (drift compensation)', () => {
    // Mock model: row N has key value N. cursorKey='[2]' lives at row 2
    // regardless of the stored row hint.
    const sel = new KeyedSelection({
      getModel: getKeyedModel,
      cursorKey: keyOf(2),
      cursorRowHint: 42,
      cursorColumn: 0,
    });
    expect(sel.cursorRow).toBe(2);
    expect(sel.cursorColumn).toBe(0);
  });

  it('falls back to cursorRowHint when the key is out of viewport', () => {
    // Row 999 is outside the mock's [0..99] viewport.
    const sel = new KeyedSelection({
      getModel: getKeyedModel,
      cursorKey: keyOf(999),
      cursorRowHint: 42,
      cursorColumn: 3,
    });
    expect(sel.cursorRow).toBe(42);
    expect(sel.cursorColumn).toBe(3);
  });

  it('is preserved through clear', () => {
    const sel = singleRow(2).withCursor(2, 3).clear();
    expect(sel.cursorRow).toBe(2);
    expect(sel.cursorColumn).toBe(3);
    expect(sel.isEmpty()).toBe(true);
  });

  it('is preserved through trimmed', () => {
    const sel = singleRow(2).withCursor(2, 3).trimmed();
    expect(sel.cursorRow).toBe(2);
    expect(sel.cursorColumn).toBe(3);
  });

  it('is preserved through withCommittedRanges', () => {
    const sel = empty()
      .withCursor(2, 3)
      .withCommittedRanges([new GridRange(null, 5, null, 5)]);
    expect(sel.cursorRow).toBe(2);
    expect(sel.cursorColumn).toBe(3);
  });

  it('is preserved through selectAll', () => {
    const sel = empty().withCursor(2, 3).selectAll();
    expect(sel.cursorRow).toBe(2);
    expect(sel.cursorColumn).toBe(3);
  });
});

// ─── selectionEnd tracking ───────────────────────────────────────────────────

describe('selectionEnd', () => {
  it('defaults to null on an empty selection', () => {
    expect(empty().selectionEndRow).toBeNull();
    expect(empty().selectionEndColumn).toBeNull();
  });

  it('stores endpoint via withSelectionEnd', () => {
    const sel = empty().withSelectionEnd(7, 2);
    expect(sel.selectionEndRow).toBe(7);
    expect(sel.selectionEndColumn).toBe(2);
  });

  it('returns identity when withSelectionEnd is a no-op', () => {
    const sel = empty().withSelectionEnd(7, 2);
    expect(sel.withSelectionEnd(7, 2)).toBe(sel);
  });

  it('resolves selectionEndKey against the current viewport', () => {
    const sel = new KeyedSelection({
      getModel: getKeyedModel,
      selectionEndKey: keyOf(4),
      selectionEndRowHint: 42,
      selectionEndColumn: 0,
    });
    expect(sel.selectionEndRow).toBe(4);
  });

  it('is cleared by clear() (transient state)', () => {
    const sel = empty().withSelectionEnd(3, 3).clear();
    expect(sel.selectionEndRow).toBeNull();
    expect(sel.selectionEndColumn).toBeNull();
  });
});

// ─── resolve ─────────────────────────────────────────────────────────────────

describe('resolve', () => {
  it('clears pendingRanges and commits the provided key values', () => {
    const pending = new KeyedSelection({
      getModel: getKeyedModel,
      pendingRanges: [new GridRange(null, 0, null, 4)],
    });
    const resolved = pending.resolve(new Map([keyValuesOf(0), keyValuesOf(2)]));
    expect(resolved.pendingRanges).toHaveLength(0);
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
    const excludeOne = new KeyedSelection({
      getModel: getKeyedModel,
      selectedKeys: new Set([keyOf(5)]),
      invertedSelection: true,
    });
    expect(excludeOne.getUniqueRowCount()).toBe(ROW_COUNT - 1);
  });

  it('returns null when pendingRanges is non-empty', () => {
    const pending = new KeyedSelection({
      getModel: getKeyedModel,
      pendingRanges: [new GridRange(null, 0, null, 9)],
    });
    expect(pending.getUniqueRowCount()).toBeNull();
  });

  it('returns null when hasUniqueSelectionKeys is false', () => {
    const nonUniqueModel = { ...mockModel, hasUniqueSelectionKeys: false };
    const getModel: GetKeyedModel = () => nonUniqueModel as never;
    const sel = new KeyedSelection({
      getModel,
      selectedKeys: new Set([keyOf(0)]),
      selectedKeyValues: new Map([keyValuesOf(0)]),
    });
    expect(sel.getUniqueRowCount()).toBeNull();
  });
});

// ─── withGestureAnchor / getGestureAnchor ────────────────────────────────────

describe('getGestureAnchor', () => {
  const originalValueForCell = mockModel.valueForCell;

  afterEach(() => {
    mockModel.viewport = { top: 0, bottom: ROW_COUNT - 1 };
    mockModel.valueForCell = originalValueForCell;
  });

  it('returns null when no anchor was set', () => {
    expect(empty().getGestureAnchor()).toBeNull();
  });

  it('returns the anchor row set by withGestureAnchor', () => {
    const sel = empty().withGestureAnchor(5, 0);
    expect(sel.getGestureAnchor()).toEqual({ row: 5, column: null });
  });

  it('clears the anchor when withGestureAnchor is called with null', () => {
    const sel = empty().withGestureAnchor(5, 0).withGestureAnchor(null, null);
    expect(sel.getGestureAnchor()).toBeNull();
  });

  it('returns the current viewport row of the anchor key after ticks', () => {
    // Anchor captured at row 5 with key [5]. Then the table "ticks": the row
    // at position 5 now has key [42] (arbitrary), and the anchor key [5] has
    // moved to row 7.
    const sel = empty().withGestureAnchor(5, 0);
    mockModel.valueForCell = (_col, row) => {
      if (row === 5) return 42;
      if (row === 7) return 5;
      return row;
    };
    expect(sel.getGestureAnchor()).toEqual({ row: 7, column: null });
  });

  it('falls back to the row hint when the anchor key is out of viewport', () => {
    const sel = empty().withGestureAnchor(5, 0);
    mockModel.viewport = { top: 10, bottom: 20 };
    expect(sel.getGestureAnchor()).toEqual({ row: 5, column: null });
  });

  it('prefers the viewport row closest to the row hint for non-unique keys', () => {
    // Anchor was clicked at row 10 with key [10]. After a tick, row 10 no
    // longer holds that key but rows 2 and 15 do (non-unique keys). Distance
    // to the hint: row 2 → 8, row 15 → 5, so row 15 wins.
    const sel = empty().withGestureAnchor(10, 0);
    mockModel.valueForCell = (_col, row) => {
      if (row === 2 || row === 15) return 10;
      if (row === 10) return 999;
      return row;
    };
    expect(sel.getGestureAnchor()).toEqual({ row: 15, column: null });
  });
});

// ─── commitGesture (multi-row → pending or fast path) ────────────────────

describe('commitGesture', () => {
  afterEach(() => {
    mockModel.viewport = { top: 0, bottom: ROW_COUNT - 1 };
  });

  it('is identity when there is no overlay to commit', () => {
    const sel = singleRow(5);
    expect(sel.commitGesture(sel, { autoSelectRow: false })).toBe(sel);
  });

  it('commits a multi-row overlay synchronously when fully in viewport', () => {
    const withOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 0, null, 5)],
    });
    const result = withOverlay.commitGesture(empty(), {
      autoSelectRow: false,
    });
    expect(result.pendingRanges).toHaveLength(0);
    for (let r = 0; r <= 5; r += 1) {
      expect(result.isRowSelected(r)).toBe(true);
    }
    expect(result.selectedKeys.size).toBe(6);
  });

  it('returns a pending selection when overlay extends beyond viewport', () => {
    mockModel.viewport = { top: 0, bottom: 2 };
    const withOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 0, null, 5)],
    });
    const result = withOverlay.commitGesture(empty(), {
      autoSelectRow: false,
    });
    expect(result.pendingRanges).toHaveLength(1);
    expect(result.pendingRanges[0].startRow).toBe(0);
    expect(result.pendingRanges[0].endRow).toBe(5);
  });

  it('commits a single-row overlay synchronously', () => {
    const withOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 3, null, 3)],
    });
    const result = withOverlay.commitGesture(empty(), {
      autoSelectRow: false,
    });
    expect(result.pendingRanges).toHaveLength(0);
    expect(result.isRowSelected(3)).toBe(true);
  });

  it('deselects a single row when it was the entire previous selection', () => {
    const last = singleRow(3);
    const withOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 3, null, 3)],
    });
    const result = withOverlay.commitGesture(last, {
      autoSelectRow: false,
    });
    expect(result.isRowSelected(3)).toBe(false);
  });

  it('does NOT deselect a single row when allowDeselect is false (keyboard callers)', () => {
    const last = singleRow(3);
    const withOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 3, null, 3)],
    });
    const result = withOverlay.commitGesture(last, {
      autoSelectRow: false,
      allowDeselect: false,
    });
    expect(result.isRowSelected(3)).toBe(true);
  });

  it('replaces prior committed keys on drag (isReplacing=true via withMouseGestureRanges)', () => {
    // Reproduces the drag bug: prior commit selected key 2; drag extends to
    // row 5. Without isReplacing the ctrl+click toggle path fires and
    // fragments the selection. With isReplacing, the overlay replaces the
    // prior committed keys wholesale.
    const priorCommit = singleRow(2);
    const dragOverlay = priorCommit.withMouseGestureRanges(
      [new GridRange(null, 2, null, 5)],
      true
    );
    const result = dragOverlay.commitGesture(priorCommit, {
      autoSelectRow: false,
    });
    for (let r = 2; r <= 5; r += 1) {
      expect(result.isRowSelected(r)).toBe(true);
    }
    expect(result.selectedKeys.size).toBe(4);
  });

  it('adds ctrl+shift+click grown range without toggling off overlapping rows', () => {
    // Prior commit selected rows 5-9. User ctrl+shift+clicks row 12 which
    // grows the last range from 5 (anchor) to 12. Overlay = (null, 5, null, 12).
    // Expected: rows 5-12 all selected (union). Row 5 must NOT be toggled off
    // just because it was in both the prior selection and the grown range.
    const priorCommit = new KeyedSelection({
      getModel: getKeyedModel,
      selectedKeys: new Set([5, 6, 7, 8, 9].map(keyOf)),
      selectedKeyValues: new Map([5, 6, 7, 8, 9].map(keyValuesOf)),
    });
    const grownOverlay = priorCommit.withMouseGestureRanges(
      [new GridRange(null, 5, null, 12)],
      false
    );
    const result = grownOverlay.commitGesture(priorCommit, {
      autoSelectRow: false,
    });
    for (let r = 5; r <= 12; r += 1) {
      expect(result.isRowSelected(r)).toBe(true);
    }
    expect(result.selectedKeys.size).toBe(8);
  });
});

// ─── withGestureExtend (MouseSelection) ──────────────────────────────────────

describe('withGestureExtend', () => {
  const defaultOpts = { autoSelectRow: true, autoSelectColumn: false };

  it('installs a full-row overlay for replace mode', () => {
    const sel = singleRow(3).withGestureExtend(
      { row: 7, column: 0 },
      { mode: 'replace', ...defaultOpts }
    );
    // Replace clears committed keys; overlay is the single-row range.
    expect(sel.overlayRanges).toHaveLength(1);
    expect(sel.overlayRanges[0]).toEqual(new GridRange(null, 7, null, 7));
    expect(sel.selectedKeys.size).toBe(0);
  });

  it('resets anchor to cursor on replace mode', () => {
    const sel = empty().withGestureExtend(
      { row: 7, column: 0 },
      { mode: 'replace', ...defaultOpts }
    );
    expect(sel.getGestureAnchor()).toEqual({ row: 7, column: null });
  });

  it('appends to the overlay for add mode without dropping committed keys', () => {
    const sel = singleRow(3).withGestureExtend(
      { row: 7, column: 0 },
      { mode: 'add', ...defaultOpts }
    );
    expect(sel.selectedKeys.size).toBe(1);
    expect(sel.overlayRanges).toHaveLength(1);
  });

  it('extends the overlay from anchor to cursor for extend mode', () => {
    const sel = empty()
      .withGestureAnchor(3, null)
      .withGestureExtend(
        { row: 7, column: 0 },
        { mode: 'extend', ...defaultOpts }
      );
    expect(sel.overlayRanges).toHaveLength(1);
    expect(sel.overlayRanges[0]).toEqual(new GridRange(null, 3, null, 7));
  });

  it('preserves the anchor for extend mode', () => {
    const sel = empty()
      .withGestureAnchor(3, null)
      .withGestureExtend(
        { row: 7, column: 0 },
        { mode: 'extend', ...defaultOpts }
      );
    expect(sel.getGestureAnchor()).toEqual({ row: 3, column: null });
  });
});

// ─── KeyboardSelection ───────────────────────────────────────────────────────

describe('getCursorLandingCell', () => {
  it('returns null when there is no overlay (committed selection)', () => {
    // Landing is only consulted mid-gesture on the pre-commit selection.
    expect(singleRow(5).getCursorLandingCell()).toBeNull();
  });

  it('returns the top-left of the overlay for a mid-gesture selection', () => {
    const gesture = empty().withMouseGestureRanges(
      [new GridRange(null, 4, null, 6)],
      true
    );
    expect(gesture.getCursorLandingCell()).toEqual({ column: 0, row: 4 });
  });
});

describe('getNextCursorInDirection', () => {
  const { RIGHT } = GridRange.SELECTION_DIRECTION;

  it('walks the whole grid when there is no overlay', () => {
    expect(
      singleRow(5).getNextCursorInDirection({ column: 0, row: 0 }, RIGHT)
    ).toEqual({ column: 1, row: 0 });
  });

  it('cycles within a mid-gesture range', () => {
    const gesture = empty().withMouseGestureRanges(
      [new GridRange(null, 4, null, 6)],
      true
    );
    expect(
      gesture.getNextCursorInDirection(
        { column: 0, row: 4 },
        GridRange.SELECTION_DIRECTION.DOWN
      )
    ).toEqual({ column: 0, row: 5 });
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
