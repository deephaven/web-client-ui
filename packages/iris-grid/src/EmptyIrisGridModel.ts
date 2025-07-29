/* eslint class-methods-use-this: "off" */
import {
  type GridRange,
  type ModelIndex,
  type MoveOperation,
  type VisibleIndex,
} from '@deephaven/grid';
import { type dh as DhType } from '@deephaven/jsapi-types';
import { type ColumnName, Formatter } from '@deephaven/jsapi-utils';
import { EMPTY_ARRAY, EMPTY_MAP } from '@deephaven/utils';
import IrisGridModel from './IrisGridModel';
import type ColumnHeaderGroup from './ColumnHeaderGroup';
import {
  type TextAlignment,
  type PendingDataErrorMap,
  type PendingDataMap,
  type UITotalsTableConfig,
} from './CommonTypes';

class EmptyIrisGridModel extends IrisGridModel {
  constructor(dh: typeof DhType, formatter = new Formatter(dh)) {
    super(dh);

    this.modelFormatter = formatter;
  }

  modelFormatter: Formatter;

  modelCustomColumnAlignmentMap: Map<string, TextAlignment> | undefined;

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

  get columns(): readonly DhType.Column[] {
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

  get groupedColumns(): readonly DhType.Column[] {
    return EMPTY_ARRAY;
  }

  formatForCell(
    column: ModelIndex,
    row: ModelIndex
  ): DhType.Format | undefined {
    return undefined;
  }

  valueForCell(column: ModelIndex, row: ModelIndex): unknown {
    return undefined;
  }

  get filter(): readonly DhType.FilterCondition[] {
    return EMPTY_ARRAY;
  }

  set filter(filter: readonly DhType.FilterCondition[]) {
    // No-op
  }

  get partition(): readonly unknown[] {
    return EMPTY_ARRAY;
  }

  set partition(partition: readonly unknown[]) {
    // No-op
  }

  get partitionColumns(): readonly DhType.Column[] {
    return EMPTY_ARRAY;
  }

  get formatter(): Formatter {
    return this.modelFormatter;
  }

  set formatter(formatter: Formatter) {
    this.modelFormatter = formatter;
  }

  get customColumnAlignmentMap(): Map<string, TextAlignment> | undefined {
    return this.modelCustomColumnAlignmentMap;
  }

  set customColumnAlignmentMap(
    customColumnAlignmentMap: Map<string, TextAlignment> | undefined
  ) {
    this.modelCustomColumnAlignmentMap = customColumnAlignmentMap;
  }

  displayString(
    value: unknown,
    columnType: string,
    columnName?: ColumnName
  ): string {
    return '';
  }

  get sort(): readonly DhType.Sort[] {
    return EMPTY_ARRAY;
  }

  set sort(sort: readonly DhType.Sort[]) {
    // No-op
  }

  get customColumns(): readonly ColumnName[] {
    return EMPTY_ARRAY;
  }

  set customColumns(customColumns: readonly ColumnName[]) {
    // No-op
  }

  get formatColumns(): readonly DhType.CustomColumn[] {
    return EMPTY_ARRAY;
  }

  updateFrozenColumns(columns: readonly ColumnName[]): void {
    // Do nothing
  }

  get rollupConfig(): DhType.RollupConfig | null {
    return null;
  }

  set rollupConfig(rollupConfig: DhType.RollupConfig | null) {
    // No-op
  }

  get totalsConfig(): UITotalsTableConfig | null {
    return null;
  }

  set totalsConfig(totalsConfig: UITotalsTableConfig | null) {
    // No-op
  }

  export(): Promise<DhType.Table> {
    throw new Error('Method not implemented.');
  }

  columnStatistics(column: DhType.Column): Promise<DhType.ColumnStatistics> {
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
    columns?: DhType.Column[]
  ): void {
    // No-op
  }

  snapshot(ranges: readonly GridRange[]): Promise<readonly unknown[][]> {
    return Promise.resolve([]);
  }

  textSnapshot(
    ranges: readonly GridRange[],
    includeHeaders?: boolean,
    formatValue?: (
      value: unknown,
      column: DhType.Column,
      row?: DhType.Row
    ) => string
  ): Promise<string> {
    return Promise.resolve('');
  }

  valuesTable(
    columns: DhType.Column | readonly DhType.Column[]
  ): Promise<DhType.Table> {
    throw new Error('Method not implemented.');
  }

  delete(ranges: readonly GridRange[]): Promise<void> {
    return Promise.resolve();
  }

  seekRow(
    startRow: number,
    column: DhType.Column,
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
