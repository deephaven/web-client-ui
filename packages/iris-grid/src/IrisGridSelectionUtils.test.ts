import dh from '@deephaven/jsapi-shim';
import { GridRange, RangedSelection } from '@deephaven/grid';
import type { ModelSizeMap, MoveOperation } from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { KeyedSelection, type GetKeyedModel } from './KeyedSelection';
import {
  snapshotFromSelection,
  textSnapshotFromSelection,
} from './IrisGridSelectionUtils';
import IrisGridTestUtils from './IrisGridTestUtils';

const irisGridTestUtils = new IrisGridTestUtils(dh);

const NO_MOVES: readonly MoveOperation[] = [];
const NO_HIDDEN: ModelSizeMap = new Map();

// ─── model stub ──────────────────────────────────────────────────────────────

function makeModel(
  columns: DhType.Column[] = irisGridTestUtils.makeColumns(3)
) {
  return {
    columns,
    columnCount: columns.length,
    snapshot: jest.fn().mockResolvedValue([]),
    textSnapshot: jest.fn().mockResolvedValue(''),
    snapshotByKeys: jest.fn().mockResolvedValue([]),
    textSnapshotByKeys: jest.fn().mockResolvedValue(''),
    // isKeyedGridModel uses selectionKeyColumnIndices
    selectionKeyColumnIndices: [0],
  } as never;
}

// ─── selection factories ──────────────────────────────────────────────────────

function rangedSel(ranges: GridRange[]) {
  return new RangedSelection(ranges, () => ({}) as never);
}

function keyedSel(
  keyValues: ReadonlyMap<string, readonly unknown[]>,
  invertedSelection = false,
  maxRows: number | null = null
) {
  const getModel: GetKeyedModel = () => makeModel() as never;
  return new KeyedSelection(
    getModel,
    new Set(keyValues.keys()),
    [],
    invertedSelection,
    null,
    keyValues,
    maxRows
  );
}

// ─── snapshotFromSelection ────────────────────────────────────────────────────

describe('snapshotFromSelection', () => {
  describe('RangedSelection', () => {
    it('calls model.snapshot with the exact ranges when no transforms are applied', async () => {
      const model = makeModel();
      const ranges = [new GridRange(0, 0, 2, 5)];
      const sel = rangedSel(ranges);
      await snapshotFromSelection(sel, model, NO_MOVES, NO_HIDDEN);
      expect(model.snapshot).toHaveBeenCalledWith(ranges);
    });

    it('returns the value from model.snapshot', async () => {
      const expected = [[1, 2, 3]];
      const model = makeModel();
      model.snapshot.mockResolvedValue(expected);
      const result = await snapshotFromSelection(
        rangedSel([GridRange.makeCell(0, 0)]),
        model,
        NO_MOVES,
        NO_HIDDEN
      );
      expect(result).toBe(expected);
    });

    it('excludes hidden columns from the model ranges', async () => {
      const model = makeModel();
      // col 1 is hidden
      const hidden: ModelSizeMap = new Map([[1, 0]]);
      const sel = rangedSel([new GridRange(0, 0, 2, 5)]);
      await snapshotFromSelection(sel, model, NO_MOVES, hidden);
      // column 1 should be subtracted; model.snapshot gets two separate ranges
      const calledRanges: GridRange[] = model.snapshot.mock.calls[0][0];
      expect(
        calledRanges.every(r => r.startColumn !== 1 && r.endColumn !== 1)
      ).toBe(true);
      // col 0 and col 2 present
      expect(calledRanges.some(r => r.startColumn === 0)).toBe(true);
      expect(calledRanges.some(r => r.startColumn === 2)).toBe(true);
    });

    it('applies moved-column transforms to produce correct model ranges', async () => {
      const model = makeModel();
      // swap columns 0 and 1: visual 0 → model 1, visual 1 → model 0
      const moves: readonly MoveOperation[] = [{ from: 0, to: 1 }];
      // select visual column 0 (maps to model column 1 after the move)
      const sel = rangedSel([new GridRange(0, 0, 0, 5)]);
      await snapshotFromSelection(sel, model, moves, NO_HIDDEN);
      const calledRanges: GridRange[] = model.snapshot.mock.calls[0][0];
      // after the move visual col 0 → model col 1
      expect(
        calledRanges.some(r => r.startColumn === 1 && r.endColumn === 1)
      ).toBe(true);
    });
  });

  describe('KeyedSelection', () => {
    it('calls model.snapshotByKeys with all visible columns when no transforms', async () => {
      const columns = irisGridTestUtils.makeColumns(3);
      const model = makeModel(columns);
      const keyValues = new Map([['[0]', [0]]]);
      const sel = keyedSel(keyValues);
      await snapshotFromSelection(sel, model, NO_MOVES, NO_HIDDEN);
      expect(model.snapshotByKeys).toHaveBeenCalledWith(
        columns,
        keyValues,
        false,
        false,
        expect.any(Function),
        null
      );
    });

    it('passes invertedSelection and maxRows through to snapshotByKeys', async () => {
      const model = makeModel();
      const keyValues = new Map<string, readonly unknown[]>();
      const sel = keyedSel(keyValues, true, 500);
      await snapshotFromSelection(sel, model, NO_MOVES, NO_HIDDEN);
      expect(model.snapshotByKeys).toHaveBeenCalledWith(
        expect.any(Array),
        keyValues,
        true,
        false,
        expect.any(Function),
        500
      );
    });

    it('excludes hidden columns from the columns passed to snapshotByKeys', async () => {
      const columns = irisGridTestUtils.makeColumns(3);
      const model = makeModel(columns);
      // hide column 1
      const hidden: ModelSizeMap = new Map([[1, 0]]);
      const sel = keyedSel(new Map());
      await snapshotFromSelection(sel, model, NO_MOVES, hidden);
      const calledColumns: DhType.Column[] =
        model.snapshotByKeys.mock.calls[0][0];
      expect(calledColumns).toHaveLength(2);
      expect(calledColumns).not.toContain(columns[1]);
    });

    it('returns the value from model.snapshotByKeys', async () => {
      const expected = [[10, 20]];
      const model = makeModel();
      model.snapshotByKeys.mockResolvedValue(expected);
      const result = await snapshotFromSelection(
        keyedSel(new Map()),
        model,
        NO_MOVES,
        NO_HIDDEN
      );
      expect(result).toBe(expected);
    });

    it('throws when the model is not a KeyedGridModel', async () => {
      const nonKeyedModel = {
        ...makeModel(),
        selectionKeyColumnIndices: [],
      } as never;
      await expect(
        snapshotFromSelection(
          keyedSel(new Map()),
          nonKeyedModel,
          NO_MOVES,
          NO_HIDDEN
        )
      ).rejects.toThrow('KeyedSelection requires a KeyedGridModel');
    });
  });

  it('throws for an unsupported selection type', async () => {
    const fakeSelection = { isEmpty: () => false } as never;
    await expect(
      snapshotFromSelection(fakeSelection, makeModel(), NO_MOVES, NO_HIDDEN)
    ).rejects.toThrow('Unsupported selection type');
  });
});

// ─── textSnapshotFromSelection ────────────────────────────────────────────────

describe('textSnapshotFromSelection', () => {
  const formatValue = (v: unknown) => String(v);

  describe('RangedSelection', () => {
    it('calls model.textSnapshot with model ranges, includeHeaders, and formatValue', async () => {
      const model = makeModel();
      const ranges = [new GridRange(0, 0, 2, 5)];
      const sel = rangedSel(ranges);
      await textSnapshotFromSelection(
        sel,
        model,
        true,
        formatValue,
        NO_MOVES,
        NO_HIDDEN
      );
      expect(model.textSnapshot).toHaveBeenCalledWith(
        ranges,
        true,
        formatValue
      );
    });

    it('forwards includeHeaders=false correctly', async () => {
      const model = makeModel();
      await textSnapshotFromSelection(
        rangedSel([GridRange.makeCell(0, 0)]),
        model,
        false,
        formatValue,
        NO_MOVES,
        NO_HIDDEN
      );
      expect(model.textSnapshot).toHaveBeenCalledWith(
        expect.any(Array),
        false,
        formatValue
      );
    });

    it('returns the value from model.textSnapshot', async () => {
      const model = makeModel();
      model.textSnapshot.mockResolvedValue('a\tb\nc\td');
      const result = await textSnapshotFromSelection(
        rangedSel([GridRange.makeCell(0, 0)]),
        model,
        false,
        formatValue,
        NO_MOVES,
        NO_HIDDEN
      );
      expect(result).toBe('a\tb\nc\td');
    });

    it('excludes hidden columns from model ranges', async () => {
      const model = makeModel();
      const hidden: ModelSizeMap = new Map([[1, 0]]);
      await textSnapshotFromSelection(
        rangedSel([new GridRange(0, 0, 2, 3)]),
        model,
        false,
        formatValue,
        NO_MOVES,
        hidden
      );
      const calledRanges: GridRange[] = model.textSnapshot.mock.calls[0][0];
      expect(
        calledRanges.every(r => r.startColumn !== 1 && r.endColumn !== 1)
      ).toBe(true);
    });
  });

  describe('KeyedSelection', () => {
    it('calls model.textSnapshotByKeys with visible columns and correct args', async () => {
      const columns = irisGridTestUtils.makeColumns(3);
      const model = makeModel(columns);
      const keyValues = new Map([['[5]', [5]]]);
      const sel = keyedSel(keyValues, false, 200);
      await textSnapshotFromSelection(
        sel,
        model,
        true,
        formatValue,
        NO_MOVES,
        NO_HIDDEN
      );
      expect(model.textSnapshotByKeys).toHaveBeenCalledWith(
        columns,
        keyValues,
        false,
        true,
        formatValue,
        200
      );
    });

    it('returns the value from model.textSnapshotByKeys', async () => {
      const model = makeModel();
      model.textSnapshotByKeys.mockResolvedValue('key\tval');
      const result = await textSnapshotFromSelection(
        keyedSel(new Map()),
        model,
        false,
        formatValue,
        NO_MOVES,
        NO_HIDDEN
      );
      expect(result).toBe('key\tval');
    });

    it('throws when the model is not a KeyedGridModel', async () => {
      const nonKeyedModel = {
        ...makeModel(),
        selectionKeyColumnIndices: [],
      } as never;
      await expect(
        textSnapshotFromSelection(
          keyedSel(new Map()),
          nonKeyedModel,
          false,
          formatValue,
          NO_MOVES,
          NO_HIDDEN
        )
      ).rejects.toThrow('KeyedSelection requires a KeyedGridModel');
    });
  });

  it('throws for an unsupported selection type', async () => {
    const fakeSelection = { isEmpty: () => false } as never;
    await expect(
      textSnapshotFromSelection(
        fakeSelection,
        makeModel(),
        false,
        formatValue,
        NO_MOVES,
        NO_HIDDEN
      )
    ).rejects.toThrow('Unsupported selection type');
  });
});
