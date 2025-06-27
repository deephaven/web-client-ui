import dh from '@deephaven/jsapi-shim';
import IrisGridTestUtils from './IrisGridTestUtils';
import IrisGridTreeTableModel from './IrisGridTreeTableModel';

const irisGridTestUtils = new IrisGridTestUtils(dh);

describe('IrisGridTreeTableModel virtual columns', () => {
  const expectedVirtualColumn = expect.objectContaining({
    name: '__DH_UI_GROUP__',
    displayName: 'Group',
    isProxy: true,
  });
  const columns = irisGridTestUtils.makeColumns();

  test.each([
    [0, columns, columns],
    [1, columns, columns],
    [2, columns, [expectedVirtualColumn, ...columns]],
    [columns.length, columns, [expectedVirtualColumn, ...columns]],
  ])(
    `create virtual columns with group length %`,
    (groupedLength, allColumns, expected) => {
      const groupedColumns = allColumns.slice(0, groupedLength);
      const table = irisGridTestUtils.makeTreeTable(
        allColumns,
        [],
        groupedColumns
      );
      const model = new IrisGridTreeTableModel(dh, table);
      expect(model.columns).toEqual(expected);
    }
  );

  test.each([
    ['filter', 'Filter'],
    ['sort', 'Sort'],
    ['formatColor', 'Color'],
    ['get', 'get'],
    ['getFormat', 'getFormat'],
    ['formatNumber', 'formatNumber'],
    ['formatDate', 'formatDate'],
  ])('virtual column method %s is not implemented', (method, displayName) => {
    const groupedColumns = columns.slice(0, 2);
    const table = irisGridTestUtils.makeTreeTable(columns, [], groupedColumns);
    const model = new IrisGridTreeTableModel(dh, table);
    expect(() => model.columns[0][method]()).toThrow(
      new Error(`${displayName} not implemented for virtual column`)
    );
  });
});

describe('IrisGridTreeTableModel layoutHints', () => {
  test('null layout hints by default', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(columns);
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(null);
  });

  test('layoutHints set on tree table', () => {
    const columns = irisGridTestUtils.makeColumns();
    const layoutHints = { hiddenColumns: ['X'], frozenColumns: ['Y'] };
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      [],
      columns,
      100,
      [],
      layoutHints
    );
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(layoutHints);
  });

  test('layoutHints undefined (e.g. not set on the table)', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      [],
      columns,
      100,
      []
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (table as any).layoutHints = undefined;
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(undefined);
  });

  test('layoutHints property does not exist should not crash', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      [],
      columns,
      100,
      []
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (table as any).layoutHints;
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.layoutHints).toEqual(undefined);
  });
});

describe('IrisGridTreeTableModel values table', () => {
  it('is available for tree tables', () => {
    const columns = irisGridTestUtils.makeColumns();
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      [],
      columns,
      100,
      []
    );
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.isValuesTableAvailable).toBe(true);
  });
});

describe('IrisGridTreeTableModel aggregatedColumns getter', () => {
  it('is available for tree tables', () => {
    const columns = irisGridTestUtils.makeColumns(5);
    const aggregatedColumns = columns.slice(1, 3);
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      aggregatedColumns,
      columns,
      100,
      []
    );
    const model = new IrisGridTreeTableModel(dh, table);

    expect(model.isAggregatedColumnsAvailable).toBe(true);
    expect(model.aggregatedColumns).toEqual(aggregatedColumns);
  });
});

describe('IrisGridTreeTableModel isFilterable', () => {
  it('handles grouped, aggregated, and constituent columns correctly', () => {
    const columns = irisGridTestUtils.makeColumns(5);
    const groupedColumns = [columns[0]];
    const aggregatedColumns = columns.slice(2, 4);
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      aggregatedColumns,
      groupedColumns,
      100,
      []
    );
    const model = new IrisGridTreeTableModel(dh, table);
    // No virtual column for a single grouped column
    // Grouped columns are filterable
    expect(model.isFilterable(0)).toBe(true);
    // Non-aggregated column is filterable
    expect(model.isFilterable(1)).toBe(true);
    // Aggregated columns are not filterable
    expect(model.isFilterable(2)).toBe(false);
    expect(model.isFilterable(3)).toBe(false);
    // Non-aggregated column is filterable
    expect(model.isFilterable(4)).toBe(true);
  });

  it('handles virtual, grouped, aggregated, and constituent columns correctly', () => {
    const columns = irisGridTestUtils.makeColumns(5);
    const groupedColumns = columns.slice(0, 2);
    const aggregatedColumns = columns.slice(2, 4);
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      aggregatedColumns,
      groupedColumns,
      100,
      []
    );
    const model = new IrisGridTreeTableModel(dh, table);
    // Virtual column is not filterable
    expect(model.isFilterable(0)).toBe(false);
    // Grouped columns are filterable
    expect(model.isFilterable(1)).toBe(true);
    expect(model.isFilterable(2)).toBe(true);
    // Aggregated columns are not filterable
    expect(model.isFilterable(3)).toBe(false);
    expect(model.isFilterable(4)).toBe(false);
    // Non-aggregated column is filterable
    expect(model.isFilterable(5)).toBe(true);
  });

  it('returns true only for grouped columns when the API does not support aggregatedColumns', () => {
    const columns = irisGridTestUtils.makeColumns(5);
    const groupedColumns = columns.slice(0, 2);
    const table = irisGridTestUtils.makeTreeTable(
      columns,
      [],
      groupedColumns,
      100,
      []
    );
    const model = new IrisGridTreeTableModel(dh, table);
    jest
      .spyOn(model, 'isAggregatedColumnsAvailable', 'get')
      .mockReturnValue(false);
    // Virtual column is not filterable
    expect(model.isFilterable(0)).toBe(false);
    // Grouped columns are filterable
    expect(model.isFilterable(1)).toBe(true);
    expect(model.isFilterable(2)).toBe(true);
    // Rest of the columns are not filterable
    expect(model.isFilterable(3)).toBe(false);
    expect(model.isFilterable(4)).toBe(false);
    expect(model.isFilterable(5)).toBe(false);
  });
});
