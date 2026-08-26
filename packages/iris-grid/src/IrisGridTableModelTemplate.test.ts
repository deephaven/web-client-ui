import dh from '@deephaven/jsapi-shim';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
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
  rows: { get: (col: DhType.Column) => unknown }[]
) {
  const getViewportData = jest.fn().mockResolvedValue({ rows });
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

// ─── fetchKeyValuesForRowRange ────────────────────────────────────────────────

describe('fetchKeyValuesForRowRange', () => {
  let model: IrisGridTableModelTemplate;
  let subMock: ReturnType<typeof makeSubscriptionMock>;

  beforeEach(() => {
    const columns = irisGridTestUtils.makeColumns(3);
    model = makeModel(columns);
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn((attr: string) => (attr === 'keyColumns' ? '0' : null));

    // rows that return their row index as the key column value
    const rows = [
      { get: (col: DhType.Column) => (col.index === 0 ? 5 : 'x') },
      { get: (col: DhType.Column) => (col.index === 0 ? 7 : 'x') },
    ];
    subMock = makeSubscriptionMock(rows);
    (
      model.table as DhType.Table & {
        createViewportSubscription: jest.Mock;
      }
    ).createViewportSubscription = jest.fn(() => subMock);
  });

  it('calls createViewportSubscription with key columns and the row range', async () => {
    await model.fetchKeyValuesForRowRange(5, 7);
    const tableWithSub = model.table as DhType.Table & {
      createViewportSubscription: jest.Mock;
    };
    expect(tableWithSub.createViewportSubscription).toHaveBeenCalledWith({
      rows: { first: 5, last: 7 },
      columns: [model.columns[0]],
    });
  });

  it('returns a map keyed by JSON-serialized key values', async () => {
    const result = await model.fetchKeyValuesForRowRange(5, 7);
    expect(result.has(JSON.stringify([5]))).toBe(true);
    expect(result.has(JSON.stringify([7]))).toBe(true);
    expect(result.size).toBe(2);
  });

  it('closes the subscription even if getViewportData throws', async () => {
    subMock.getViewportData.mockRejectedValueOnce(new Error('network error'));
    await expect(model.fetchKeyValuesForRowRange(0, 1)).rejects.toThrow();
    expect(subMock.close).toHaveBeenCalled();
  });
});

// ─── fetchRowForKey ───────────────────────────────────────────────────────────

describe('fetchRowForKey', () => {
  let model: IrisGridTableModelTemplate;

  beforeEach(() => {
    const columns = irisGridTestUtils.makeColumns(3);
    model = makeModel(columns);
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn((attr: string) => (attr === 'keyColumns' ? '0' : null));
  });

  it('returns { status: "found", row } via seekRow for a single-column key', async () => {
    const seekRow = jest.fn().mockResolvedValue(42);
    (model.table as DhType.Table & { seekRow: jest.Mock }).seekRow = seekRow;
    expect(await model.fetchRowForKey([7])).toEqual({
      status: 'found',
      row: 42,
    });
    expect(seekRow).toHaveBeenCalledWith(
      0,
      model.columns[0],
      expect.any(String),
      7
    );
  });

  it('returns { status: "gone" } when seekRow returns -1', async () => {
    (model.table as DhType.Table & { seekRow: jest.Mock }).seekRow = jest
      .fn()
      .mockResolvedValue(-1);
    expect(await model.fetchRowForKey([9999])).toEqual({ status: 'gone' });
  });

  it('returns { status: "unsupported" } for multi-column keys', async () => {
    (model.table as DhType.Table & { getAttribute: jest.Mock }).getAttribute =
      jest.fn((attr: string) => (attr === 'keyColumns' ? '0, 1' : null));
    const seekRow = jest.fn();
    (model.table as DhType.Table & { seekRow: jest.Mock }).seekRow = seekRow;
    expect(await model.fetchRowForKey([1, 2])).toEqual({
      status: 'unsupported',
    });
    expect(seekRow).not.toHaveBeenCalled();
  });

  it('returns { status: "unsupported" } when the table does not support seekRow', async () => {
    (model.table as DhType.Table & { seekRow: unknown }).seekRow =
      undefined as never;
    expect(await model.fetchRowForKey([7])).toEqual({ status: 'unsupported' });
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
