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
    lastSingleRow: row,
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

  it('returns false for inverted selection (pendingRows path)', () => {
    expect(allRows().isEmpty()).toBe(false);
  });

  it('returns false when pendingRows is set', () => {
    const pending = new KeyedSelection({
      getModel: getKeyedModel,
      pendingRows: new GridRange(null, 0, null, 10),
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

// ─── resolve ─────────────────────────────────────────────────────────────────

describe('resolve', () => {
  it('clears pendingRows and commits the provided key values', () => {
    const pending = new KeyedSelection({
      getModel: getKeyedModel,
      pendingRows: new GridRange(null, 0, null, 4),
    });
    const resolved = pending.resolve(new Map([keyValuesOf(0), keyValuesOf(2)]));
    expect(resolved.pendingRows).toBeNull();
    expect(resolved.isRowSelected(0)).toBe(true);
    expect(resolved.isRowSelected(2)).toBe(true);
    expect(resolved.isRowSelected(1)).toBe(false);
  });

  it('merges endpointKeyData for keys missing from the fetched map', () => {
    const endpoints = new Map([keyValuesOf(0), keyValuesOf(4)]);
    const pending = new KeyedSelection({
      getModel: getKeyedModel,
      pendingRows: new GridRange(null, 0, null, 4),
      endpointKeyData: endpoints,
    });
    // Simulate a fetch that missed both endpoints because of drift.
    const resolved = pending.resolve(new Map([keyValuesOf(1), keyValuesOf(3)]));
    expect(resolved.isRowSelected(0)).toBe(true);
    expect(resolved.isRowSelected(1)).toBe(true);
    expect(resolved.isRowSelected(3)).toBe(true);
    expect(resolved.isRowSelected(4)).toBe(true);
    expect(resolved.selectedKeys.size).toBe(4);
  });

  it('prefers fetched values over endpointKeyData when a key is in both', () => {
    const endpoints = new Map<string, readonly unknown[]>([
      [keyOf(0), ['stale']],
    ]);
    const pending = new KeyedSelection({
      getModel: getKeyedModel,
      pendingRows: new GridRange(null, 0, null, 0),
      endpointKeyData: endpoints,
    });
    const resolved = pending.resolve(new Map([[keyOf(0), ['fresh']]]));
    expect(resolved.selectedKeyValues.get(keyOf(0))).toEqual(['fresh']);
  });

  it('skips endpoints listed in excludedEndpoints (removed rows)', () => {
    const endpoints = new Map([keyValuesOf(0), keyValuesOf(4)]);
    const pending = new KeyedSelection({
      getModel: getKeyedModel,
      pendingRows: new GridRange(null, 1, null, 4),
      endpointKeyData: endpoints,
    });
    const resolved = pending.resolve(
      new Map([keyValuesOf(1), keyValuesOf(4)]),
      new Set([keyOf(0)])
    );
    expect(resolved.isRowSelected(0)).toBe(false);
    expect(resolved.isRowSelected(1)).toBe(true);
    expect(resolved.isRowSelected(4)).toBe(true);
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

  it('returns null when pendingRows is set', () => {
    const pending = new KeyedSelection({
      getModel: getKeyedModel,
      pendingRows: new GridRange(null, 0, null, 9),
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

// ─── commitMouseGesture (multi-row → pending or fast path) ────────────────────

describe('commitMouseGesture', () => {
  afterEach(() => {
    mockModel.viewport = { top: 0, bottom: ROW_COUNT - 1 };
  });

  it('commits a multi-row overlay synchronously when fully in viewport', () => {
    const withOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 0, null, 5)],
    });
    const result = withOverlay.commitMouseGesture(empty(), false);
    expect(result.pendingRows).toBeNull();
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
    const result = withOverlay.commitMouseGesture(empty(), false);
    expect(result.pendingRows).not.toBeNull();
    expect(result.pendingRows?.startRow).toBe(0);
    expect(result.pendingRows?.endRow).toBe(5);
  });

  it('commits a single-row overlay synchronously', () => {
    const withOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 3, null, 3)],
    });
    const result = withOverlay.commitMouseGesture(empty(), false);
    expect(result.pendingRows).toBeNull();
    expect(result.isRowSelected(3)).toBe(true);
  });

  it('deselects a single row when it was the entire previous selection', () => {
    const last = singleRow(3);
    const withOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 3, null, 3)],
    });
    const result = withOverlay.commitMouseGesture(last, false);
    expect(result.isRowSelected(3)).toBe(false);
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
    const result = dragOverlay.commitMouseGesture(priorCommit, false);
    for (let r = 2; r <= 5; r += 1) {
      expect(result.isRowSelected(r)).toBe(true);
    }
    expect(result.selectedKeys.size).toBe(4);
  });

  it('sets pendingAnchorLookup when the anchor is out of viewport', () => {
    // Viewport 20..30. Anchor key was captured at row 5 (now out of viewport);
    // user shift-clicks row 25 (in viewport). Slow path fires with lookup.
    mockModel.viewport = { top: 20, bottom: 30 };
    const anchoredOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 5, null, 25)],
      anchorKey: keyOf(5),
      anchorValues: [5],
      anchorRow: 5,
    });
    const result = anchoredOverlay.commitMouseGesture(empty(), false);
    expect(result.pendingRows).not.toBeNull();
    expect(result.pendingAnchorLookup).not.toBeNull();
    expect(result.pendingAnchorLookup?.values).toEqual([5]);
    expect(result.pendingAnchorLookup?.targetRow).toBe(25);
  });

  it('leaves pendingAnchorLookup null when the anchor is in viewport', () => {
    // Viewport 0..10 contains the anchor row 5. Overlay extends to row 50 (OOV).
    mockModel.viewport = { top: 0, bottom: 10 };
    const anchoredOverlay = new KeyedSelection({
      getModel: getKeyedModel,
      overlayRanges: [new GridRange(null, 5, null, 50)],
      anchorKey: keyOf(5),
      anchorValues: [5],
      anchorRow: 5,
    });
    const result = anchoredOverlay.commitMouseGesture(empty(), false);
    expect(result.pendingRows).not.toBeNull();
    expect(result.pendingAnchorLookup).toBeNull();
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
