import { GridRangeIndex, ModelSizeMap } from '@deephaven/grid';
import dh, {
  Column,
  FilterCondition,
  InputTable,
  RollupConfig,
  Row,
  Sort,
  Table,
  TableViewportSubscription,
} from '@deephaven/jsapi-shim';
import { Formatter } from '@deephaven/jsapi-utils';
import IrisGridProxyModel from './IrisGridProxyModel';

class IrisGridTestUtils {
  static DEFAULT_TYPE = 'java.lang.String';

  static valueForCell(
    rowIndex: GridRangeIndex,
    columnIndex: GridRangeIndex,
    formatValue?: boolean
  ): string {
    let value = `${rowIndex},${columnIndex}`;
    if (formatValue) {
      value = `(${value})`;
    }
    return value;
  }

  static makeColumn(
    name?: string,
    type: string = IrisGridTestUtils.DEFAULT_TYPE,
    index = 0
  ): Column {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).Column({ index, name, type });
  }

  static makeRollupTableConfig(): RollupConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).RollupTableConfig();
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

  static makeRow(i: number): Row {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = new (dh as any).Row({ index: i, name: `${i}` });

    row.get = jest.fn(column =>
      IrisGridTestUtils.valueForCell(i, column.index)
    );

    return row;
  }

  static makeFilter(): FilterCondition {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).FilterCondition();
  }

  static makeSort(): Sort {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).Sort();
  }

  static makeTable(
    columns = IrisGridTestUtils.makeColumns(),
    size = 1000000000,
    sort = []
  ): Table {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = new (dh as any).Table({ columns, size, sort });
    table.copy = jest.fn(() => Promise.resolve(table));
    return table;
  }

  static makeInputTable(keyColumns = []): InputTable {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).InputTable(keyColumns);
  }

  static makeSubscription(
    table = IrisGridTestUtils.makeTable()
  ): TableViewportSubscription {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).TableViewportSubscription({ table });
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
