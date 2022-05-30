import { GridRangeIndex } from '@deephaven/grid';
import dh, { Column } from '@deephaven/jsapi-shim';
import { Formatter } from '@deephaven/jsapi-utils';
import IrisGridProxyModel from './IrisGridProxyModel';

class IrisGridTestUtils {
  static DEFAULT_TYPE = 'java.lang.String';

  static valueForCell(
    rowIndex: GridRangeIndex,
    columnIndex: GridRangeIndex,
    formatValue: boolean
  ): string {
    let value = `${rowIndex},${columnIndex}`;
    if (formatValue) {
      value = `(${value})`;
    }
    return value;
  }

  static makeColumn(
    name: string,
    type = IrisGridTestUtils.DEFAULT_TYPE,
    index = 0
  ): Column {
    return new dh.Column({ index, name, type });
  }

  static makeColumns(count = 5): Column[] {
    const columns = [];
    for (let i = 0; i < count; i += 1) {
      columns.push(this.makeColumn(`${i}`, IrisGridTestUtils.DEFAULT_TYPE, i));
    }
    return columns;
  }

  static makeUserColumnWidths(count = 5): ModelSizeMap {
    const userColumnWidths = new Map();
    for (let i = 0; i < count; i += 1) {
      userColumnWidths.set(i.toString(), 100);
    }
    return userColumnWidths;
  }

  static makeRow(i: number) {
    const row = new dh.Row({ index: i, name: `${i}` });

    row.get = jest.fn(column =>
      IrisGridTestUtils.valueForCell(i, column.index)
    );

    return row;
  }

  static makeFilter() {
    return new dh.FilterCondition();
  }

  static makeSort() {
    return new dh.Sort();
  }

  static makeTable(
    columns = IrisGridTestUtils.makeColumns(),
    size = 1000000000
  ) {
    const table = new dh.Table({ columns, size });
    table.copy = jest.fn(() => Promise.resolve(table));
    return table;
  }

  static makeInputTable(keyColumns = []) {
    return new dh.InputTable(keyColumns);
  }

  static makeSubscription(table = IrisGridTestUtils.makeTable()) {
    return new dh.TableViewportSubscription({ table });
  }

  static makeModel(
    table = IrisGridTestUtils.makeTable(),
    formatter = new Formatter(),
    inputTable = null
  ): IrisGridProxyModel {
    return new IrisGridProxyModel(table, formatter, inputTable);
  }
}

export default IrisGridTestUtils;
