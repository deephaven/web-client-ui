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
  constructor(dh: DhType, formatter = new Formatter(dh)) {
    super(dh);

    this.modelFormatter = formatter;
  }

  modelFormatter: Formatter;

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

  get columns(): readonly Column[] {
    return [];
  }

  getColumnIndexByName(name: string): ModelIndex | undefined {
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

  get filter(): readonly FilterCondition[] {
    return [];
  }

  set filter(filter: readonly FilterCondition[]) {
    // No-op
  }

  get partition(): readonly unknown[] {
    return [];
  }

  set partition(partition: readonly unknown[]) {
    // No-op
  }

  get partitionColumns(): readonly Column[] {
    return [];
  }

  get formatter(): Formatter {
    return this.modelFormatter;
  }

  set formatter(formatter: Formatter) {
    this.modelFormatter = formatter;
  }

  displayString(
    value: unknown,
    columnType: string,
    columnName?: ColumnName
  ): string {
    return '';
  }

  get sort(): Sort[] {
    return [];
  }

  set sort(sort: Sort[]) {
    // No-op
  }

  get customColumns(): readonly ColumnName[] {
    return [];
  }

  set customColumns(customColumns: readonly ColumnName[]) {
    // No-op
  }

  get formatColumns(): readonly CustomColumn[] {
    return [];
  }

  updateFrozenColumns(columns: readonly ColumnName[]): void {
    // Do nothing
  }

  get rollupConfig(): RollupConfig | null {
    return null;
  }

  set rollupConfig(rollupConfig: RollupConfig | null) {
    // No-op
  }

  get totalsConfig(): UITotalsTableConfig | null {
    return null;
  }

  set totalsConfig(totalsConfig: UITotalsTableConfig | null) {
    // No-op
  }

  export(): Promise<Table> {
    throw new Error('Method not implemented.');
  }

  columnStatistics(column: Column): Promise<ColumnStatistics> {
    throw new Error('Method not implemented.');
  }

  get selectDistinctColumns(): readonly ColumnName[] {
    return [];
  }

  set selectDistinctColumns(selectDistinctColumns: readonly ColumnName[]) {
    // No-op
  }

  get pendingDataMap(): PendingDataMap {
    return new Map();
  }

  set pendingDataMap(map: PendingDataMap) {
    // No-op
  }

  get pendingRowCount(): number {
    return 0;
  }

  set pendingRowCount(count: number) {
    // No-op
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
    // No-op
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

  valuesTable(columns: Column | readonly Column[]): Promise<Table> {
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

  get columnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return [];
  }

  set columnHeaderGroups(groups: readonly ColumnHeaderGroup[]) {
    // No-op
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
