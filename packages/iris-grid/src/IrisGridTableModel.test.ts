import { GridRange } from '@deephaven/grid';
import dh from '@deephaven/jsapi-shim';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import IrisGridTableModel from './IrisGridTableModel';
import IrisGridTestUtils from './IrisGridTestUtils';

jest.useFakeTimers();

const irisGridTestUtils = new IrisGridTestUtils(dh);

/**
 * Build an IrisGridTableModel wired for delete tests.
 *
 * @param keyColumnNames - names of the key columns (determines how many AND conditions per row)
 * @param tableSize      - number of rows in the backing table
 */
function makeModelForDelete(
  keyColumnNames: string[],
  tableSize = 100
): {
  model: IrisGridTableModel;
  inputTable: DhType.InputTable;
  deleteTableMock: { applyFilter: jest.Mock; close: jest.Mock };
} {
  const keyColumns = keyColumnNames.map(
    (name, i) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (dh as any).Column({ index: i, name, type: 'int' })
  );
  const valueColumns = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    new (dh as any).Column({
      index: keyColumnNames.length,
      name: 'Value',
      type: 'java.lang.String',
    }),
  ];

  const table = irisGridTestUtils.makeTable({
    columns: [...keyColumns, ...valueColumns],
    size: tableSize,
  });

  const inputTable = {
    ...IrisGridTestUtils.makeInputTable(keyColumns, valueColumns),
    keyColumns,
    deleteTable: jest.fn(() => Promise.resolve()),
  } as unknown as DhType.InputTable;

  const model = new IrisGridTableModel(
    dh,
    table,
    new Formatter(dh),
    inputTable
  );

  const deleteTableMock = { applyFilter: jest.fn(), close: jest.fn() };
  (table.copy as jest.Mock).mockResolvedValue(deleteTableMock);

  return { model, inputTable, deleteTableMock };
}

describe('IrisGridTableModel delete filter construction', () => {
  // Spy on FilterCondition prototype methods so we can assert how they are called.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FC = (dh as any).FilterCondition;

  let orSpy: jest.SpyInstance;
  let andSpy: jest.SpyInstance;

  beforeEach(() => {
    orSpy = jest.spyOn(FC.prototype, 'or');
    andSpy = jest.spyOn(FC.prototype, 'and');
  });

  afterEach(() => {
    orSpy.mockRestore();
    andSpy.mockRestore();
  });

  it('uses the row filter directly when there is only one row (no .or() call)', async () => {
    const { model, inputTable, deleteTableMock } = makeModelForDelete(['Key']);

    // Single row snapshot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(model as any, 'snapshot').mockResolvedValue([[42]]);

    await model.delete([new GridRange(null, 0, null, 0)]);

    expect(deleteTableMock.applyFilter).toHaveBeenCalledTimes(1);
    expect(inputTable.deleteTable).toHaveBeenCalledWith(deleteTableMock);
    // filters.length === 1, so filters[0] is used directly — no .or() needed
    expect(orSpy).not.toHaveBeenCalled();
    // columnFilters.length === 1, so columnFilters[0] is used directly — no .and() needed
    expect(andSpy).not.toHaveBeenCalled();
  });

  it('uses flat variadic .or() for multiple rows (called once, not chained)', async () => {
    const { model, inputTable, deleteTableMock } = makeModelForDelete(['Key']);

    // Three-row snapshot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(model as any, 'snapshot').mockResolvedValue([[1], [2], [3]]);

    await model.delete([new GridRange(null, 0, null, 2)]);

    expect(deleteTableMock.applyFilter).toHaveBeenCalledTimes(1);
    expect(inputTable.deleteTable).toHaveBeenCalledWith(deleteTableMock);
    // .or() must be called exactly once (flat), not once-per-extra-row (chained)
    expect(orSpy).toHaveBeenCalledTimes(1);
    // The single .or() call receives all remaining filters as variadic args (2 in this case)
    expect(orSpy.mock.calls[0]).toHaveLength(2);
  });

  it('uses flat variadic .and() for multiple key columns per row (called once, not chained)', async () => {
    const { model, inputTable, deleteTableMock } = makeModelForDelete([
      'Key1',
      'Key2',
    ]);

    // Single row, two key-column values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(model as any, 'snapshot').mockResolvedValue([[10, 20]]);

    await model.delete([new GridRange(null, 0, null, 0)]);

    expect(deleteTableMock.applyFilter).toHaveBeenCalledTimes(1);
    expect(inputTable.deleteTable).toHaveBeenCalledWith(deleteTableMock);
    // .and() called exactly once (flat) with the remaining column filter as its sole arg
    expect(andSpy).toHaveBeenCalledTimes(1);
    expect(andSpy.mock.calls[0]).toHaveLength(1);
    // Only one row, so no .or()
    expect(orSpy).not.toHaveBeenCalled();
  });
});

describe('IrisGridTableModel viewport columns after custom columns change', () => {
  function makeModel() {
    const columns = irisGridTestUtils.makeColumns(3);
    const table = irisGridTestUtils.makeTable({ columns });
    const model = new IrisGridTableModel(dh, table, new Formatter(dh));
    // Table and subscription share one mock so the last call reflects the latest viewport request
    const setViewportSpy = jest.fn();
    const subscription = {
      close: jest.fn(),
      setViewport: setViewportSpy,
    } as unknown as DhType.TableViewportSubscription;
    setViewportSpy.mockReturnValue(subscription);
    table.setViewport = setViewportSpy;
    model.setViewport(0, 10, columns);
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).toHaveBeenLastCalledWith(
      0,
      expect.any(Number),
      columns
    );
    return { model, table, columns, setViewportSpy };
  }

  function mockApplyCustomColumns(table: DhType.Table) {
    jest
      .spyOn(table, 'applyCustomColumns')
      .mockImplementation(customColumns => {
        // eslint-disable-next-line no-param-reassign
        (table as { customColumns: unknown }).customColumns = customColumns;
      });
  }

  function fireTableEvent(table: DhType.Table, name: string) {
    (table as unknown as { fireEvent: (name: string) => void }).fireEvent(name);
  }

  function lastSubscribedColumns(setViewportSpy: jest.Mock) {
    const { calls } = setViewportSpy.mock;
    return calls[calls.length - 1][2] as DhType.Column[] | undefined;
  }

  it('defers the viewport until the new table state is running, then remaps its columns', () => {
    const { model, table, columns, setViewportSpy } = makeModel();
    model.startListening();
    setViewportSpy.mockClear();
    mockApplyCustomColumns(table);

    model.customColumns = ['Test=1'];
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).not.toHaveBeenCalled();

    // Viewport changes before the new table state is visible are deferred too
    model.setViewport(1, 11, columns);
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).not.toHaveBeenCalled();

    const newColumns = irisGridTestUtils.makeColumns(4);
    (table as { columns: DhType.Column[] }).columns = newColumns;
    fireTableEvent(table, dh.Table.EVENT_REQUEST_SUCCEEDED);
    jest.runOnlyPendingTimers();

    // The viewport still has the previous state's columns, so they map to the new state's
    const subscribedColumns = lastSubscribedColumns(setViewportSpy);
    expect(subscribedColumns).toHaveLength(columns.length);
    subscribedColumns?.forEach((column, i) =>
      expect(column).toBe(newColumns[i])
    );

    model.setViewport(0, 10, newColumns);
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).toHaveBeenLastCalledWith(
      expect.any(Number),
      expect.any(Number),
      newColumns
    );
  });

  it('applies the viewport again when the pending request fails', () => {
    const { model, table, columns, setViewportSpy } = makeModel();
    model.startListening();
    setViewportSpy.mockClear();
    mockApplyCustomColumns(table);

    model.customColumns = ['Test=1'];
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).not.toHaveBeenCalled();

    // The table rolls back to its previous state, so its columns are unchanged
    fireTableEvent(table, dh.Table.EVENT_REQUEST_FAILED);
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).toHaveBeenLastCalledWith(
      expect.any(Number),
      expect.any(Number),
      columns
    );
  });

  it('keeps deferring when listeners restart before the pending operation completes', () => {
    const { model, table, columns, setViewportSpy } = makeModel();
    model.startListening();
    setViewportSpy.mockClear();
    mockApplyCustomColumns(table);

    model.customColumns = ['Test=1'];
    model.stopListening();
    model.startListening();
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).not.toHaveBeenCalled();

    const newColumns = irisGridTestUtils.makeColumns(4);
    (table as { columns: DhType.Column[] }).columns = newColumns;
    fireTableEvent(table, dh.Table.EVENT_REQUEST_SUCCEEDED);
    jest.runOnlyPendingTimers();

    const subscribedColumns = lastSubscribedColumns(setViewportSpy);
    expect(subscribedColumns).toHaveLength(columns.length);
    subscribedColumns?.forEach((column, i) =>
      expect(column).toBe(newColumns[i])
    );
  });

  it('releases a pending operation that completes while listeners are stopped', () => {
    const { model, table, columns, setViewportSpy } = makeModel();
    model.startListening();
    setViewportSpy.mockClear();
    mockApplyCustomColumns(table);

    model.customColumns = ['Test=1'];
    model.stopListening();
    fireTableEvent(table, dh.Table.EVENT_REQUEST_FAILED);
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).not.toHaveBeenCalled();

    model.startListening();
    jest.runOnlyPendingTimers();

    expect(setViewportSpy).toHaveBeenLastCalledWith(
      expect.any(Number),
      expect.any(Number),
      columns
    );
  });

  it('uses fresh columns when removing custom columns synchronously restores a previous state', () => {
    const { model, table, columns, setViewportSpy } = makeModel();
    model.startListening();
    mockApplyCustomColumns(table);
    model.customColumns = ['Test=1'];
    const addedColumns = irisGridTestUtils.makeColumns(4);
    (table as { columns: DhType.Column[] }).columns = addedColumns;
    model.setViewport(0, 10, addedColumns);
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).toHaveBeenLastCalledWith(
      expect.any(Number),
      expect.any(Number),
      addedColumns
    );

    // Removing the custom column restores the original, already-running state synchronously
    jest
      .spyOn(table, 'applyCustomColumns')
      .mockImplementation(customColumns => {
        // eslint-disable-next-line no-param-reassign
        (table as { customColumns: unknown }).customColumns = customColumns;
        // eslint-disable-next-line no-param-reassign
        (table as { columns: DhType.Column[] }).columns = columns;
        fireTableEvent(table, dh.Table.EVENT_REQUEST_SUCCEEDED);
      });

    model.customColumns = [];
    jest.runOnlyPendingTimers();
    // The viewport still has the added state's columns, so the one that no longer exists is dropped
    const subscribedColumns = lastSubscribedColumns(setViewportSpy);
    expect(subscribedColumns).toHaveLength(columns.length);
    subscribedColumns?.forEach((column, i) => expect(column).toBe(columns[i]));

    model.setViewport(1, 11, columns);
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).toHaveBeenLastCalledWith(
      expect.any(Number),
      expect.any(Number),
      columns
    );
  });

  it('uses the requested columns after reverting a change before its columns become visible', () => {
    const { model, table, columns, setViewportSpy } = makeModel();
    model.startListening();
    setViewportSpy.mockClear();
    mockApplyCustomColumns(table);

    // The new state is pending, so table.columns still returns the original columns
    model.customColumns = ['Test=1'];
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).not.toHaveBeenCalled();

    // Reverting synchronously restores the original running state
    jest
      .spyOn(table, 'applyCustomColumns')
      .mockImplementation(customColumns => {
        // eslint-disable-next-line no-param-reassign
        (table as { customColumns: unknown }).customColumns = customColumns;
        fireTableEvent(table, dh.Table.EVENT_REQUEST_SUCCEEDED);
      });

    model.customColumns = [];
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).toHaveBeenLastCalledWith(
      expect.any(Number),
      expect.any(Number),
      columns
    );
  });

  it('keeps the viewport columns when the custom columns are unchanged', () => {
    const { model, table, columns, setViewportSpy } = makeModel();
    (table as { customColumns: unknown }).customColumns = ['Test=1'];
    mockApplyCustomColumns(table);

    model.customColumns = ['Test=1'];
    jest.runOnlyPendingTimers();
    expect(setViewportSpy).toHaveBeenLastCalledWith(
      0,
      expect.any(Number),
      columns
    );
  });
});
