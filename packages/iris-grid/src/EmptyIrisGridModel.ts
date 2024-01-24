/* eslint class-methods-use-this: "off" */
import {
  GridRange,
  ModelIndex,
  MoveOperation,
  VisibleIndex,
} from '@deephaven/grid';
import {
  dh.Column,
  dh.ColumnStatistics,
  dh.CustomColumn,
  dh as DhType,
  dh.FilterCondition,
  dh.Format,
  dh.RollupConfig,
  dh.Row,
  dh.Sort,
  dh.Table,
} from '@deephaven/jsapi-types';
import { ColumnName, Formatter } from '@deephaven/jsapi-utils';
import { EMPTY_ARRAY, EMPTY_MAP } from '@deephaven/utils';
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

  get columns(): readonly dh.Column[] {
    return EMPTY_ARRAY;
  }

  getColumnIndexByName(name: string): ModelIndex | undefined {
    return undefined;
  }

  get initialMovedColumns(): readonly MoveOperation[] {
    return EMPTY_ARRAY;
  }

  get initialMovedRows(): readonly MoveOperation[] {
    return EMPTY_ARRAY;
  }

  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return EMPTY_ARRAY;
  }

  get groupedColumns(): readonly dh.Column[] {
    return EMPTY_ARRAY;
  }

  formatForCell(column: ModelIndex, row: ModelIndex): dh.Format | undefined {
    return undefined;
  }

  valueForCell(column: ModelIndex, row: ModelIndex): unknown {
    return undefined;
  }

  get filter(): readonly dh.FilterCondition[] {
    return EMPTY_ARRAY;
  }

  set filter(filter: readonly dh.FilterCondition[]) {
    // No-op
  }

  get partition(): readonly unknown[] {
    return EMPTY_ARRAY;
  }

  set partition(partition: readonly unknown[]) {
    // No-op
  }

  get partitionColumns(): readonly dh.Column[] {
    return EMPTY_ARRAY;
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

  get sort(): readonly dh.Sort[] {
    return EMPTY_ARRAY;
  }

  set sort(sort: readonly dh.Sort[]) {
    // No-op
  }

  get customColumns(): readonly ColumnName[] {
    return EMPTY_ARRAY;
  }

  set customColumns(customColumns: readonly ColumnName[]) {
    // No-op
  }

  get formatColumns(): readonly dh.CustomColumn[] {
    return EMPTY_ARRAY;
  }

  updateFrozenColumns(columns: readonly ColumnName[]): void {
    // Do nothing
  }

  get rollupConfig(): dh.RollupConfig | null {
    return null;
  }

  set rollupConfig(rollupConfig: dh.RollupConfig | null) {
    // No-op
  }

  get totalsConfig(): UITotalsTableConfig | null {
    return null;
  }

  set totalsConfig(totalsConfig: UITotalsTableConfig | null) {
    // No-op
  }

  export(): Promise<dh.Table> {
    throw new Error('Method not implemented.');
  }

  columnStatistics(column: dh.Column): Promise<dh.ColumnStatistics> {
    throw new Error('Method not implemented.');
  }

  get selectDistinctColumns(): readonly ColumnName[] {
    return EMPTY_ARRAY;
  }

  set selectDistinctColumns(selectDistinctColumns: readonly ColumnName[]) {
    // No-op
  }

  get pendingDataMap(): PendingDataMap {
    return EMPTY_MAP;
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
    return EMPTY_MAP;
  }

  commitPending(): Promise<void> {
    return Promise.resolve();
  }

  setViewport(
    top: VisibleIndex,
    bottom: VisibleIndex,
    columns?: dh.Column[]
  ): void {
    // No-op
  }

  snapshot(ranges: readonly GridRange[]): Promise<readonly unknown[][]> {
    return Promise.resolve([]);
  }

  textSnapshot(
    ranges: readonly GridRange[],
    includeHeaders?: boolean,
    formatValue?: (value: unknown, column: dh.Column, row?: dh.Row) => string
  ): Promise<string> {
    return Promise.resolve('');
  }

  valuesTable(columns: dh.Column | readonly dh.Column[]): Promise<dh.Table> {
    throw new Error('Method not implemented.');
  }

  delete(ranges: readonly GridRange[]): Promise<void> {
    return Promise.resolve();
  }

  seekRow(
    startRow: number,
    column: dh.Column,
    valueType: unknown,
    value: unknown,
    insensitive?: boolean,
    contains?: boolean,
    isBackwards?: boolean
  ): Promise<number> {
    return Promise.resolve(0);
  }

  get columnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return EMPTY_ARRAY;
  }

  set columnHeaderGroups(groups: readonly ColumnHeaderGroup[]) {
    // No-op
  }

  get columnHeaderGroupMap(): ReadonlyMap<string, ColumnHeaderGroup> {
    return EMPTY_MAP;
  }

  getColumnHeaderParentGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ColumnHeaderGroup | undefined {
    return undefined;
  }
}

export default EmptyIrisGridModel;
