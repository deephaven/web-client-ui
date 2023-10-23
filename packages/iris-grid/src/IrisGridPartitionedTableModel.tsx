import {
  DataBarOptions,
  GridRange,
  ModelIndex,
  MoveOperation,
  VisibleIndex,
} from '@deephaven/grid';
import type {
  Column,
  ColumnStatistics,
  CustomColumn,
  dh as DhType,
  FilterCondition,
  Format,
  LayoutHints,
  PartitionedTable,
  RollupConfig,
  Row,
  Sort,
  Table,
  ValueTypeUnion,
} from '@deephaven/jsapi-types';
import { Formatter } from '@deephaven/jsapi-utils';
import { EventShimCustomEvent } from '@deephaven/utils';
import Log from '@deephaven/log';
import {
  ColumnName,
  PendingDataMap,
  PendingDataErrorMap,
  UITotalsTableConfig,
} from './CommonTypes';
import ColumnHeaderGroup from './ColumnHeaderGroup';
import IrisGridModel from './IrisGridModel';
import IrisGridTableModel from './IrisGridTableModel';
import EmptyIrisGridModel from './EmptyIrisGridModel';
import { IrisGridThemeType } from './IrisGridTheme';

const log = Log.module('IrisGridPartitionedTableModel');

class IrisGridPartitionedTableModel extends IrisGridModel {
  private irisFormatter: Formatter;

  private partitionedTable: PartitionedTable;
  // Track every getTable and close them all at the end (test opening a closed getTable)
  // Test getTable(key) and hold a reference to it, call close on PartitionedTable, check if table is still open

  private model: IrisGridTableModel | EmptyIrisGridModel;

  private partitionKeys: unknown[];

  /**
   * @param dh JSAPI instance
   * @param table Partitioned table to be used in the model
   * @param formatter The formatter to use when getting formats
   */
  constructor(
    dh: DhType,
    partitionedTable: PartitionedTable,
    formatter = new Formatter(dh)
  ) {
    super(dh);
    this.partitionedTable = partitionedTable;
    this.irisFormatter = formatter;
    this.partitionKeys = this.partitionedTable.getKeys().values().next().value;
    this.model = new EmptyIrisGridModel(dh);
  }

  get rowCount(): number {
    return this.model.rowCount;
  }

  get columnCount(): number {
    return this.model.columnCount;
  }

  textForCell(column: number, row: number): string {
    return this.model.textForCell(column, row);
  }

  textForColumnHeader(column: ModelIndex, depth?: number): string | undefined {
    return this.model.textForColumnHeader(column, depth);
  }

  get columns(): readonly Column[] {
    return this.model.columns;
  }

  getColumnIndexByName(name: string): ModelIndex | undefined {
    return this.model.getColumnIndexByName(name);
  }

  get originalColumns(): readonly Column[] {
    return this.model.originalColumns;
  }

  get initialMovedColumns(): readonly MoveOperation[] {
    return this.model.initialMovedColumns;
  }

  get initialMovedRows(): readonly MoveOperation[] {
    return this.model.initialMovedRows;
  }

  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return this.model.initialColumnHeaderGroups;
  }

  get groupedColumns(): readonly Column[] {
    return this.model.groupedColumns;
  }

  formatForCell(column: number, row: number): Format | undefined {
    return this.model.formatForCell(column, row);
  }

  valueForCell(column: ModelIndex, row: ModelIndex): unknown {
    return this.model.valueForCell(column, row);
  }

  get filter(): FilterCondition[] {
    return this.model.filter;
  }

  set filter(value: FilterCondition[]) {
    this.model.filter = value;
  }

  get partition(): unknown[] {
    return this.partitionKeys;
  }

  set partition(value: unknown[]) {
    log.debug2('set partition', value);
    this.partitionKeys = value;
    this.updateTable();
  }

  get formatter(): Formatter {
    return this.irisFormatter;
  }

  set formatter(formatter: Formatter) {
    this.irisFormatter = formatter;
  }

  displayString(
    value: unknown,
    columnType: string,
    columnName?: string | undefined
  ): string {
    return this.model.displayString(value, columnType, columnName);
  }

  get sort(): Sort[] {
    return this.model.sort;
  }

  set sort(value: Sort[]) {
    this.model.sort = value;
  }

  get customColumns(): ColumnName[] {
    return this.model.customColumns;
  }

  set customColumns(customColumns: ColumnName[]) {
    this.model.customColumns = customColumns;
  }

  get formatColumns(): CustomColumn[] {
    return this.model.formatColumns;
  }

  set formatColumns(formatColumns: CustomColumn[]) {
    this.model.formatColumns = formatColumns;
  }

  updateFrozenColumns(columns: ColumnName[]): void {
    this.model.updateFrozenColumns(columns);
  }

  get rollupConfig(): RollupConfig | null {
    return this.model.rollupConfig;
  }

  set rollupConfig(rollupConfig: RollupConfig | null) {
    this.model.rollupConfig = rollupConfig;
  }

  get totalsConfig(): UITotalsTableConfig | null {
    return this.model.totalsConfig;
  }

  set totalsConfig(totalsConfig: UITotalsTableConfig | null) {
    this.model.totalsConfig = totalsConfig;
  }

  get layoutHints(): LayoutHints | null {
    return this.model.layoutHints;
  }

  get frontColumns(): readonly ColumnName[] {
    return this.model.frontColumns;
  }

  get backColumns(): readonly ColumnName[] {
    return this.model.backColumns;
  }

  get frozenColumns(): readonly ColumnName[] {
    return this.model.frozenColumns;
  }

  isColumnFrozen(index: ModelIndex): boolean {
    return this.model.isColumnFrozen(index);
  }

  isColumnSortable(index: ModelIndex): boolean {
    return this.model.isColumnSortable(index);
  }

  get isFilterRequired(): boolean {
    return this.model.isFilterRequired;
  }

  static get isPartitionRequired(): boolean {
    return true;
  }

  get isReversible(): boolean {
    return this.model.isReversible;
  }

  export(): Promise<Table> {
    return this.model.export();
  }

  get isColumnStatisticsAvailable(): boolean {
    return this.model.isColumnStatisticsAvailable;
  }

  get description(): string {
    return this.model.description;
  }

  columnStatistics(column: Column): Promise<ColumnStatistics> {
    return this.model.columnStatistics(column);
  }

  get isCustomColumnsAvailable(): boolean {
    return this.model.isCustomColumnsAvailable;
  }

  get isFormatColumnsAvailable(): boolean {
    return this.model.isFormatColumnsAvailable;
  }

  get isExportAvailable(): boolean {
    return this.model.isExportAvailable;
  }

  get isValuesTableAvailable(): boolean {
    return this.model.isValuesTableAvailable;
  }

  get isChartBuilderAvailable(): boolean {
    return this.model.isChartBuilderAvailable;
  }

  get isRollupAvailable(): boolean {
    return this.model.isRollupAvailable;
  }

  get isSelectDistinctAvailable(): boolean {
    return this.model.isSelectDistinctAvailable;
  }

  get isTotalsAvailable(): boolean {
    return this.model.isTotalsAvailable;
  }

  get selectDistinctColumns(): ColumnName[] {
    return this.model.selectDistinctColumns;
  }

  set selectDistinctColumns(names: ColumnName[]) {
    this.model.selectDistinctColumns = names;
  }

  get pendingDataMap(): PendingDataMap {
    return this.model.pendingDataMap;
  }

  set pendingDataMap(map: PendingDataMap) {
    this.model.pendingDataMap = map;
  }

  get pendingRowCount(): number {
    return this.model.pendingRowCount;
  }

  set pendingRowCount(count: number) {
    this.model.pendingRowCount = count;
  }

  get pendingDataErrors(): PendingDataErrorMap {
    return this.model.pendingDataErrors;
  }

  commitPending(): Promise<void> {
    return this.model.commitPending();
  }

  isFilterable(columnIndex: ModelIndex): boolean {
    return this.model.isFilterable(columnIndex);
  }

  setViewport(
    top: VisibleIndex,
    bottom: VisibleIndex,
    columns?: Column[]
  ): void {
    this.model.setViewport(top, bottom, columns);
  }

  snapshot(ranges: readonly GridRange[]): Promise<readonly unknown[][]> {
    return this.model.snapshot(ranges);
  }

  textSnapshot(
    ranges: readonly GridRange[],
    includeHeaders?: boolean,
    formatValue?: (value: unknown, column: Column, row?: Row) => string
  ): Promise<string> {
    return this.model.textSnapshot(ranges, includeHeaders, formatValue);
  }

  valuesTable(column: Column): Promise<Table> {
    return this.model.valuesTable(column);
  }

  close(): void {
    // TODO
    this.partitionedTable.close();
    // close model table
    // close keytables, subscription table
  }

  isRowMovable(): boolean {
    return this.model.isRowMovable();
  }

  delete(ranges: readonly GridRange[]): Promise<void> {
    return this.model.delete(ranges);
  }

  seekRow(
    startRow: number,
    column: Column,
    valueType: ValueTypeUnion,
    value: unknown,
    insensitive?: boolean,
    contains?: boolean,
    isBackwards?: boolean
  ): Promise<number> {
    return this.model.seekRow(
      startRow,
      column,
      valueType,
      value,
      insensitive,
      contains,
      isBackwards
    );
  }

  get isSeekRowAvailable(): boolean {
    return this.model.isSeekRowAvailable;
  }

  get columnHeaderGroups(): ColumnHeaderGroup[] {
    return this.model.columnHeaderGroups;
  }

  set columnHeaderGroups(groups: ColumnHeaderGroup[]) {
    this.model.columnHeaderGroups = groups;
  }

  get columnHeaderGroupMap(): ReadonlyMap<string, ColumnHeaderGroup> {
    return this.model.columnHeaderGroupMap;
  }

  getColumnHeaderParentGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ColumnHeaderGroup | undefined {
    return this.model.getColumnHeaderParentGroup(modelIndex, depth);
  }

  dataBarOptionsForCell(
    column: number,
    row: number,
    theme: IrisGridThemeType
  ): DataBarOptions {
    return this.model.dataBarOptionsForCell(column, row, theme);
  }

  async initializeModel(): Promise<IrisGridModel> {
    const initTable = await this.partitionedTable.getTable(this.partitionKeys);
    this.model = new IrisGridTableModel(this.dh, initTable, this.irisFormatter);
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: this.model.columns,
      })
    );
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.TABLE_CHANGED, {
        detail: this.model.table,
      })
    );
    return Promise.resolve(this.model);
  }

  async updateTable(): Promise<void> {
    this.model.table =
      this.partitionKeys.length > 0
        ? await this.partitionedTable.getTable(this.partitionKeys)
        : await this.partitionedTable.getMergedTable();
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.TABLE_CHANGED, {
        detail: this.model.table,
      })
    );
  }
}

export default IrisGridPartitionedTableModel;
