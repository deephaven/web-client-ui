/* eslint class-methods-use-this: "off" */
import {
  GridRange,
  ModelIndex,
  MoveOperation,
  VisibleIndex,
} from '@deephaven/grid';
import {
  Column,
  ColumnStatistics,
  CustomColumn,
  dh as DhType,
  FilterCondition,
  Format,
  RollupConfig,
  Row,
  Sort,
  Table,
} from '@deephaven/jsapi-types';
import { ColumnName, Formatter } from '@deephaven/jsapi-utils';
import IrisGridModel from './IrisGridModel';
import ColumnHeaderGroup from './ColumnHeaderGroup';
import {
  PendingDataErrorMap,
  PendingDataMap,
  UITotalsTableConfig,
} from './CommonTypes';

class EmptyIrisGridModel extends IrisGridModel {
  constructor(dh: DhType) {
    super(dh);

    this.dh = dh;
    this.formatter = new Formatter(dh);
  }

  dh: DhType;

  table: Table | null = null;

  columns: Column[] = [];

  filter: FilterCondition[] = [];

  partition: unknown[] = [];

  partitionColumns: Column[] = [];

  formatter: Formatter;

  sort: Sort[] = [];

  customColumns: ColumnName[] = [];

  formatColumns: CustomColumn[] = [];

  rollupConfig: RollupConfig | null = null;

  totalsConfig: UITotalsTableConfig | null = null;

  selectDistinctColumns: ColumnName[] = [];

  pendingDataMap: PendingDataMap = new Map();

  pendingRowCount = 0;

  columnHeaderGroups: ColumnHeaderGroup[] = [];

  get rowCount(): number {
    return 0;
  }

  get columnCount(): number {
    return 0;
  }

  textForCell(column: number, row: number): string {
    return '';
  }

  textForColumnHeader(column: ModelIndex, depth?: number): string | undefined {
    return undefined;
  }

  getColumnIndexByName(name: string): number | undefined {
    return undefined;
  }

  get initialMovedColumns(): readonly MoveOperation[] {
    return [];
  }

  get initialMovedRows(): readonly MoveOperation[] {
    return [];
  }

  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return [];
  }

  get groupedColumns(): readonly Column[] {
    return [];
  }

  formatForCell(column: ModelIndex, row: ModelIndex): Format | undefined {
    return undefined;
  }

  valueForCell(column: ModelIndex, row: ModelIndex): unknown {
    return undefined;
  }

  displayString(
    value: unknown,
    columnType: string,
    columnName?: ColumnName
  ): string {
    return '';
  }

  updateFrozenColumns(columns: readonly ColumnName[]): void {
    // Do nothing
  }

  export(): Promise<Table> {
    throw new Error('Method not implemented.');
  }

  columnStatistics(column: Column): Promise<ColumnStatistics> {
    throw new Error('Method not implemented.');
  }

  get pendingDataErrors(): PendingDataErrorMap {
    return new Map();
  }

  commitPending(): Promise<void> {
    return Promise.resolve();
  }

  setViewport(
    top: VisibleIndex,
    bottom: VisibleIndex,
    columns?: Column[]
  ): void {
    // Do nothing
  }

  snapshot(ranges: readonly GridRange[]): Promise<readonly unknown[][]> {
    return Promise.resolve([]);
  }

  textSnapshot(
    ranges: readonly GridRange[],
    includeHeaders?: boolean,
    formatValue?: (value: unknown, column: Column, row?: Row) => string
  ): Promise<string> {
    return Promise.resolve('');
  }

  valuesTable(column: Column): Promise<Table> {
    throw new Error('Method not implemented.');
  }

  delete(ranges: readonly GridRange[]): Promise<void> {
    return Promise.resolve();
  }

  seekRow(
    startRow: number,
    column: Column,
    valueType: unknown,
    value: unknown,
    insensitive?: boolean,
    contains?: boolean,
    isBackwards?: boolean
  ): Promise<number> {
    return Promise.resolve(0);
  }

  get columnHeaderGroupMap(): ReadonlyMap<string, ColumnHeaderGroup> {
    return new Map();
  }

  getColumnHeaderParentGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ColumnHeaderGroup | undefined {
    return undefined;
  }
}

export default EmptyIrisGridModel;
