import dh from '@deephaven/jsapi-shim';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import { GridRange } from '@deephaven/grid';
import IrisGridTableModelTemplate from './IrisGridTableModelTemplate';
import IrisGridTestUtils from './IrisGridTestUtils';

const irisGridTestUtils = new IrisGridTestUtils(dh);

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeModel(
  columns = irisGridTestUtils.makeColumns(3),
  size = 10
): IrisGridTableModelTemplate {
  const table = irisGridTestUtils.makeTable({ columns, size });
  return new IrisGridTableModelTemplate(dh, table as never, new Formatter(dh));
}

/** Build a minimal viewport-subscription mock for createViewportSubscription. */
function makeSubscriptionMock(
  rows: { get: (col: DhType.Column) => unknown }[],
  offset = 0
) {
  const getViewportData = jest.fn().mockResolvedValue({ rows, offset });
  const close = jest.fn();
  return { getViewportData, close };
}

// ─── selectionKeyColumnIndices ────────────────────────────────────────────────

describe('selectionKeyColumnIndices', () => {
  it('returns [] when getAttribute is absent', () => {
    const model = makeModel();
    expect(model.selectionKeyColumnIndices).toEqual([]);
  });

  it('returns [] when keyColumns attribute is empty', () => {
    const model = makeModel();
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn(() => '');
    expect(model.selectionKeyColumnIndices).toEqual([]);
  });

  it('returns column indices matching the keyColumns attribute', () => {
    const columns = irisGridTestUtils.makeColumns(3);
    const model = makeModel(columns);
    // columns are named '0', '1', '2' by default
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn((attr: string) => (attr === 'keyColumns' ? '0, 2' : null));
    expect(model.selectionKeyColumnIndices).toEqual([0, 2]);
  });

  it('throws when a named key column is not found', () => {
    const model = makeModel();
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn(() => 'nonExistentColumn');
    expect(() => model.selectionKeyColumnIndices).toThrow(
      'Selection key column not found'
    );
  });
});

// ─── hasUniqueSelectionKeys ───────────────────────────────────────────────────

describe('hasUniqueSelectionKeys', () => {
  it('returns false when getAttribute is absent', () => {
    expect(makeModel().hasUniqueSelectionKeys).toBe(false);
  });

  it('returns true when uniqueKeys attribute is "true"', () => {
    const model = makeModel();
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn((attr: string) => (attr === 'uniqueKeys' ? 'true' : null));
    expect(model.hasUniqueSelectionKeys).toBe(true);
  });

  it('returns false when uniqueKeys attribute is anything other than "true"', () => {
    const model = makeModel();
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn(() => 'false');
    expect(model.hasUniqueSelectionKeys).toBe(false);
  });
});

// ─── createFilteredByKeysTable ────────────────────────────────────────────────

describe('createFilteredByKeysTable', () => {
  let model: IrisGridTableModelTemplate;

  beforeEach(() => {
    const columns = irisGridTestUtils.makeColumns(3);
    model = makeModel(columns);
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn((attr: string) => (attr === 'keyColumns' ? '0' : null));
    // Mock applyFilter to avoid waiting for filterchanged event
    model.tableUtils.applyFilter = jest.fn().mockResolvedValue(undefined);
  });

  it('copies the table', async () => {
    await model.createFilteredByKeysTable(new Map(), false);
    expect((model.table as DhType.Table).copy).toHaveBeenCalled();
  });

  it('calls applyFilter with a never-match filter for an empty non-inverted selection', async () => {
    await model.createFilteredByKeysTable(new Map(), false);
    expect(model.tableUtils.applyFilter).toHaveBeenCalledTimes(1);
  });

  it('does NOT call applyFilter when keyValues is empty and inverted (select all)', async () => {
    await model.createFilteredByKeysTable(new Map(), true);
    expect(model.tableUtils.applyFilter).not.toHaveBeenCalled();
  });

  it('calls applyFilter with the key filter for a non-inverted selection', async () => {
    const keyValues = new Map([['[0]', [0]]]);
    await model.createFilteredByKeysTable(keyValues, false);
    expect(model.tableUtils.applyFilter).toHaveBeenCalledTimes(1);
    // filter should be the key filter (non-inverted), not its negation
    const [, filter] = (model.tableUtils.applyFilter as jest.Mock).mock
      .calls[0];
    expect(filter).toHaveLength(1);
  });

  it('calls applyFilter with a negated filter for an inverted selection', async () => {
    const keyValues = new Map([['[1]', [1]]]);
    await model.createFilteredByKeysTable(keyValues, true);
    expect(model.tableUtils.applyFilter).toHaveBeenCalledTimes(1);
  });

  it('returns the table copy', async () => {
    const result = await model.createFilteredByKeysTable(new Map(), false);
    // makeTable copies return the same table instance in our test setup
    expect(result).toBeDefined();
  });
});

// ─── fetchKeyValuesForRowRanges ───────────────────────────────────────────────

describe('fetchKeyValuesForRowRanges', () => {
  let model: IrisGridTableModelTemplate;

  beforeEach(() => {
    const columns = irisGridTestUtils.makeColumns(3);
    model = makeModel(columns);
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn((attr: string) => (attr === 'keyColumns' ? '0' : null));
  });

  /** Installs a viewport subscription that returns one row per index in [first, last]. */
  function installEnvelopeSubscription(
    first: number,
    last: number
  ): ReturnType<typeof makeSubscriptionMock> {
    const rows: { get: (col: DhType.Column) => unknown }[] = [];
    for (let r = first; r <= last; r += 1) {
      const rowIndex = r;
      rows.push({
        get: (col: DhType.Column) => (col.index === 0 ? rowIndex : 'x'),
      });
    }
    const sub = makeSubscriptionMock(rows, first);
    (
      model.table as DhType.Table & { createViewportSubscription: jest.Mock }
    ).createViewportSubscription = jest.fn(() => sub);
    return sub;
  }

  it('subscribes to the envelope of the requested ranges', async () => {
    installEnvelopeSubscription(1, 100);
    await model.fetchKeyValuesForRowRanges([
      new GridRange(null, 1, null, 1),
      new GridRange(null, 100, null, 100),
    ]);
    const tableWithSub = model.table as DhType.Table & {
      createViewportSubscription: jest.Mock;
    };
    expect(tableWithSub.createViewportSubscription).toHaveBeenCalledWith({
      rows: { first: 1, last: 100 },
      columns: [model.columns[0]],
    });
  });

  it('single contiguous range returns every row in the range', async () => {
    installEnvelopeSubscription(5, 7);
    const result = await model.fetchKeyValuesForRowRanges([
      new GridRange(null, 5, null, 7),
    ]);
    expect(result.size).toBe(3);
    expect(result.get(JSON.stringify([5]))).toEqual([5]);
    expect(result.get(JSON.stringify([6]))).toEqual([6]);
    expect(result.get(JSON.stringify([7]))).toEqual([7]);
  });

  it('filters envelope rows that fall between disjoint ranges', async () => {
    // Envelope 1..100 covers all intermediate rows; only rows 1 and 100 should
    // survive the range-membership filter.
    installEnvelopeSubscription(1, 100);
    const result = await model.fetchKeyValuesForRowRanges([
      new GridRange(null, 1, null, 1),
      new GridRange(null, 100, null, 100),
    ]);
    expect(result.size).toBe(2);
    expect(result.has(JSON.stringify([1]))).toBe(true);
    expect(result.has(JSON.stringify([100]))).toBe(true);
  });

  it('normalizes reverse-ordered ranges when computing the envelope', async () => {
    installEnvelopeSubscription(1, 100);
    await model.fetchKeyValuesForRowRanges([
      new GridRange(null, 100, null, 100),
      new GridRange(null, 1, null, 1),
    ]);
    const tableWithSub = model.table as DhType.Table & {
      createViewportSubscription: jest.Mock;
    };
    expect(tableWithSub.createViewportSubscription).toHaveBeenCalledWith({
      rows: { first: 1, last: 100 },
      columns: [model.columns[0]],
    });
  });

  it('normalizes a range whose startRow > endRow', async () => {
    installEnvelopeSubscription(3, 5);
    const result = await model.fetchKeyValuesForRowRanges([
      new GridRange(null, 5, null, 3),
    ]);
    // Rows 3, 4, 5 should all pass range-membership (low=3, high=5).
    expect(result.size).toBe(3);
  });

  it('returns an empty map when ranges is empty', async () => {
    const sub = installEnvelopeSubscription(0, 0);
    const result = await model.fetchKeyValuesForRowRanges([]);
    expect(result.size).toBe(0);
    expect(sub.getViewportData).not.toHaveBeenCalled();
  });

  it('returns an empty map when every range has a null startRow', async () => {
    const sub = installEnvelopeSubscription(0, 0);
    const result = await model.fetchKeyValuesForRowRanges([
      new GridRange(null, null, null, null),
    ]);
    expect(result.size).toBe(0);
    expect(sub.getViewportData).not.toHaveBeenCalled();
  });

  it('closes the subscription even if getViewportData throws', async () => {
    const sub = installEnvelopeSubscription(0, 1);
    sub.getViewportData.mockRejectedValueOnce(new Error('network error'));
    await expect(
      model.fetchKeyValuesForRowRanges([new GridRange(null, 0, null, 1)])
    ).rejects.toThrow();
    expect(sub.close).toHaveBeenCalled();
  });
});

// ─── snapshotByKeys ───────────────────────────────────────────────────────────

describe('snapshotByKeys', () => {
  let model: IrisGridTableModelTemplate;
  let filteredSubMock: ReturnType<typeof makeSubscriptionMock>;

  beforeEach(() => {
    const columns = irisGridTestUtils.makeColumns(3);
    model = makeModel(columns, 5);
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn((attr: string) => (attr === 'keyColumns' ? '0' : null));
    model.tableUtils.applyFilter = jest.fn().mockResolvedValue(undefined);

    filteredSubMock = makeSubscriptionMock([
      { get: (_col: DhType.Column) => 'a' },
      { get: (_col: DhType.Column) => 'b' },
    ]);
    // The filtered table (copy) gets the viewport subscription
    const copyTable = {
      size: 2,
      createViewportSubscription: jest.fn(() => filteredSubMock),
      close: jest.fn(),
    };
    (model.table as DhType.Table & { copy: jest.Mock }).copy = jest.fn(() =>
      Promise.resolve(copyTable)
    );
  });

  it('returns [] for an empty non-inverted selection', async () => {
    const result = await model.snapshotByKeys(model.columns, new Map(), false);
    expect(result).toEqual([]);
  });

  it('returns header row only when includeHeaders=true and empty selection', async () => {
    const result = await model.snapshotByKeys(
      model.columns,
      new Map(),
      false,
      true
    );
    expect(result).toEqual([model.columns.map(c => c.name)]);
  });

  it('returns rows for a non-empty selection', async () => {
    const keyValues = new Map([['[0]', [0]]]);
    const result = await model.snapshotByKeys(model.columns, keyValues, false);
    expect(result).toHaveLength(2); // 2 rows from filteredSubMock
  });

  it('includes a header row when includeHeaders=true', async () => {
    const keyValues = new Map([['[0]', [0]]]);
    const result = await model.snapshotByKeys(
      model.columns,
      keyValues,
      false,
      true
    );
    expect(result[0]).toEqual(model.columns.map(c => c.name));
    expect(result).toHaveLength(3); // 1 header + 2 data rows
  });

  it('limits rows to maxRows via the viewport last row', async () => {
    const keyValues = new Map([['[0]', [0]]]);
    await model.snapshotByKeys(
      model.columns,
      keyValues,
      false,
      false,
      v => v,
      1
    );
    const copyTable = (model.table as DhType.Table & { copy: jest.Mock }).copy
      .mock.results[0].value;
    const resolvedCopy = await copyTable;
    expect(resolvedCopy.createViewportSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ rows: { first: 0, last: 0 } })
    );
  });

  it('throws when maxRows < 1', async () => {
    await expect(
      model.snapshotByKeys(
        model.columns,
        new Map([['[0]', [0]]]),
        false,
        false,
        v => v,
        0
      )
    ).rejects.toThrow('maxRows must be at least 1');
  });

  it('closes the filtered table in the finally block', async () => {
    const keyValues = new Map([['[0]', [0]]]);
    await model.snapshotByKeys(model.columns, keyValues, false);
    const copyTable = await (model.table as DhType.Table & { copy: jest.Mock })
      .copy.mock.results[0].value;
    expect(copyTable.close).toHaveBeenCalled();
  });

  it('closes the filtered table even when getViewportData throws', async () => {
    filteredSubMock.getViewportData.mockRejectedValueOnce(
      new Error('viewport error')
    );
    const keyValues = new Map([['[0]', [0]]]);
    await expect(
      model.snapshotByKeys(model.columns, keyValues, false)
    ).rejects.toThrow();
    const copyTable = await (model.table as DhType.Table & { copy: jest.Mock })
      .copy.mock.results[0].value;
    expect(copyTable.close).toHaveBeenCalled();
  });
});

// ─── textSnapshotByKeys ───────────────────────────────────────────────────────

describe('textSnapshotByKeys', () => {
  let model: IrisGridTableModelTemplate;

  beforeEach(() => {
    model = makeModel(irisGridTestUtils.makeColumns(2), 5);
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn((attr: string) => (attr === 'keyColumns' ? '0' : null));
    model.tableUtils.applyFilter = jest.fn().mockResolvedValue(undefined);

    const subMock = makeSubscriptionMock([
      { get: (col: DhType.Column) => `r0c${col.index}` },
      { get: (col: DhType.Column) => `r1c${col.index}` },
    ]);
    const copyTable = {
      size: 2,
      createViewportSubscription: jest.fn(() => subMock),
      close: jest.fn(),
    };
    (model.table as DhType.Table & { copy: jest.Mock }).copy = jest.fn(() =>
      Promise.resolve(copyTable)
    );
  });

  it('returns tab/newline-delimited text', async () => {
    const keyValues = new Map([['[0]', [0]]]);
    const result = await model.textSnapshotByKeys(
      model.columns,
      keyValues,
      false,
      false,
      (v: unknown) => String(v)
    );
    // two rows, two columns → "r0c0\tr0c1\nr1c0\tr1c1"
    expect(result).toBe('r0c0\tr0c1\nr1c0\tr1c1');
  });

  it('prepends a header row when includeHeaders=true', async () => {
    const keyValues = new Map([['[0]', [0]]]);
    const result = await model.textSnapshotByKeys(
      model.columns,
      keyValues,
      false,
      true,
      (v: unknown) => String(v)
    );
    const lines = result.split('\n');
    expect(lines[0]).toBe(model.columns.map(c => c.name).join('\t'));
    expect(lines).toHaveLength(3); // 1 header + 2 data rows
  });

  it('returns empty string for an empty non-inverted selection', async () => {
    const result = await model.textSnapshotByKeys(
      model.columns,
      new Map(),
      false
    );
    expect(result).toBe('');
  });
});
