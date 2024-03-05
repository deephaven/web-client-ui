import dh from '@deephaven/jsapi-shim';
import IrisGridTestUtils from './IrisGridTestUtils';
import IrisGridTreeTableModel from './IrisGridTreeTableModel';

const irisGridTestUtils = new IrisGridTestUtils(dh);

describe('IrisGridTreeTableModel', () => {
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
      const table = irisGridTestUtils.makeTreeTable(allColumns, groupedColumns);
      const model = new IrisGridTreeTableModel(dh, table);
      expect(model.columns).toEqual(expected);
    }
  );
});
