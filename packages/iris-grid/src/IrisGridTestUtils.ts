import { type GridRangeIndex, type ModelSizeMap } from '@deephaven/grid';
import { dh as DhType } from '@deephaven/jsapi-types';
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
    aggregatedColumns: DhType.Column[] = [],
    groupedColumns: DhType.Column[] = [],
    size = 1000000000,
    sort = [],
    layoutHints?: Partial<DhType.LayoutHints>
  ): DhType.TreeTable {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = new (this.dh as any).TreeTable({
      columns,
      aggregatedColumns,
      groupedColumns,
      size,
      sort,
      layoutHints,
    });
    table.copy = jest.fn(() => Promise.resolve(table));
    return table;
  }

  static makeInputTable(
    keyColumns: DhType.Column[] = [],
    valueColumns: DhType.Column[] = []
  ): DhType.InputTable {
    const { keys, values } = [...keyColumns, ...valueColumns].reduce(
      (acc, col) => {
        if (keyColumns.includes(col)) acc.keys.push(col.name);
        else acc.values.push(col.name);
        return acc;
      },
      { keys: [], values: [] } as { keys: string[]; values: string[] }
    );
    return { keys, values } as DhType.InputTable;
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
