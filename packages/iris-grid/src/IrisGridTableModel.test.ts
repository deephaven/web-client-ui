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
