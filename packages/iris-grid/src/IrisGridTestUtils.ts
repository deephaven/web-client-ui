import { GridRangeIndex, ModelSizeMap } from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
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
    if (formatValue !== undefined && formatValue) {
      value = `(${value})`;
    }
    return value;
  }

  private dh: typeof DhType;

  constructor(dh: typeof DhType) {
    this.dh = dh;
  }

  makeColumn(
    name?: string,
    type: string = IrisGridTestUtils.DEFAULT_TYPE,
    index = 0
  ): DhType.Column {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).Column({ index, name, type });
  }

  makeRollupTableConfig(): DhType.RollupConfig {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).RollupTableConfig();
  }

  makeColumns(count = 5, prefix = ''): DhType.Column[] {
    const columns = [];
    for (let i = 0; i < count; i += 1) {
      columns.push(
        this.makeColumn(`${prefix}${i}`, IrisGridTestUtils.DEFAULT_TYPE, i)
      );
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

  makeRow(i: number): DhType.Row {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = new (this.dh as any).Row({ index: i, name: `${i}` });

    row.get = jest.fn(column =>
      IrisGridTestUtils.valueForCell(i, column.index)
    );

    return row;
  }

  makeFilter(): DhType.FilterCondition {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).FilterCondition();
  }

  makeSort(): DhType.Sort {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).Sort();
  }

  makeTable({
    columns = this.makeColumns(),
    size = 1000000000,
    sort = [],
    layoutHints = {},
  }: {
    columns?: DhType.Column[];
    size?: number;
    sort?: readonly DhType.Sort[];
    layoutHints?: Partial<DhType.LayoutHints>;
  } = {}): DhType.Table {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = new (this.dh as any).Table({ columns, size, sort });
    table.copy = jest.fn(() => Promise.resolve(table));
    table.freeze = jest.fn(() => Promise.resolve(table));
    table.layoutHints = layoutHints;
    return table;
  }

  makeTreeTable(
    columns = this.makeColumns(),
    size = 1000000000,
    sort = []
  ): DhType.TreeTable {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = new (this.dh as any).TreeTable({ columns, size, sort });
    table.copy = jest.fn(() => Promise.resolve(table));
    return table;
  }

  makeInputTable(keyColumns: DhType.Column[] = []): DhType.InputTable {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).InputTable(keyColumns);
  }

  makeSubscription(table = this.makeTable()): DhType.TableViewportSubscription {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).TableViewportSubscription({ table });
  }

  makeModel(
    table = this.makeTable(),
    formatter: Formatter | null = null,
    inputTable: DhType.InputTable | null = null
  ): IrisGridProxyModel {
    const { dh } = this;
    return new IrisGridProxyModel(
      dh,
      table,
      formatter ?? new Formatter(dh),
      inputTable
    );
  }
}

export default IrisGridTestUtils;
