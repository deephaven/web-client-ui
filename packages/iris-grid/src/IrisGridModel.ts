/* eslint-disable class-methods-use-this */
import {
  GridModel,
  GridRange,
  ModelIndex,
  VisibleIndex,
} from '@deephaven/grid';
import type {
  Column,
  ColumnStatistics,
  FilterCondition,
  Format,
  LayoutHints,
  RollupConfig,
  Row,
  Sort,
  Table,
  TotalsTableConfig,
} from '@deephaven/jsapi-shim';
import type { Event, EventTarget } from 'event-target-shim';
import type Formatter from './Formatter';

type RowIndex = ModelIndex;

type IrisGridModelEventNames = typeof IrisGridModel.EVENT[keyof typeof IrisGridModel.EVENT];

type IrisGridModelEventMap = {
  [E in IrisGridModelEventNames]: Event<E>;
};

/**
 * Abstract class that extends the GridModel to have more functionality, like filtering and sorting.
 * For use from IrisGrid.
 * Provides some abstraction from the dh.Table and dh.TreeTable classes, so we can treat them somewhat the same.
 * Note that it still uses dh.Column, dh.FilterCondition, dh.Sort, etc., still. Theoretically should abstract
 * those out as well, so there's no dependency on IrisAPI at all, but it's a lot of work for no real gain at this time.
 */
abstract class IrisGridModel<
  TEventMap extends Record<string, Event<string>> = Record<
    string,
    Event<string>
  >,
  TMode extends 'standard' | 'strict' = 'standard'
> extends GridModel<TEventMap & IrisGridModelEventMap, TMode> {
  static EVENT = Object.freeze({
    UPDATED: 'UPDATED',
    FORMATTER_UPDATED: 'FORMATTER_UPDATED',
    REQUEST_FAILED: 'REQUEST_FAILED',
    COLUMNS_CHANGED: 'COLUMNS_CHANGED',
    TABLE_CHANGED: 'TABLE_CHANGED',
    FILTERS_CHANGED: 'FILTERS_CHANGED',
    SORTS_CHANGED: 'SORTS_CHANGED',
    DISCONNECT: 'DISCONNECT',
    RECONNECT: 'RECONNECT',
    TOTALS_UPDATED: 'TOTALS_UPDATED',
    PENDING_DATA_UPDATED: 'PENDING_DATA_UPDATED',
  } as const);

  constructor() {
    super();

    this.listenerCount = 0;
  }

  listenerCount: number;

  // Pulled directly from event-target-shim implementation signature
  // https://github.com/mysticatea/event-target-shim/blob/master/src/lib/event-target.ts#L99
  // Using Parameters<GridModel['addEventListener']> doesn't work
  addEventListener<T extends string & keyof TEventMap>(
    type0: T,
    callback0?: EventTarget.EventListener<this, TEventMap[T]> | null,
    options0?: boolean | EventTarget.AddOptions
  ): void {
    super.addEventListener(type0, callback0 as never, options0 as never);

    this.listenerCount += 1;
    if (this.listenerCount === 1) {
      this.startListening();
    }
  }

  removeEventListener<T extends string & keyof TEventMap>(
    type0: T,
    callback0?: EventTarget.EventListener<this, TEventMap[T]> | null,
    options0?: boolean | EventTarget.Options
  ): void {
    super.removeEventListener(type0, callback0 as never, options0 as never);

    this.listenerCount -= 1;
    if (this.listenerCount === 0) {
      this.stopListening();
    }
  }

  /**
   * Function called when first listener is added.
   * Override for implementation specific behaviour.
   */
  startListening(): void {
    // no-op
  }

  /**
   * Function called when last listener is removed.
   * Override for implementation specific behaviour.
   */
  stopListening(): void {
    // no-op
  }

  /**
   * Gets the columns for this model
   * @returns All columns in the model
   */
  get columns(): Column[] {
    throw new Error('get columns not implemented');
  }

  /**
   * Gets the column index for this model
   * @param name The model column name.
   * @returns The numeric index of the requested column.
   */
  getColumnIndexByName(name: string): ModelIndex {
    throw new Error('getColumnIndexByName not implemented');
  }

  /**
   * Gets the columns for the model before any transformations (such as rollups) are applied.
   * @returns All original columns in the model.
   */
  get originalColumns(): Column[] {
    return this.columns;
  }

  /**
   * Retrieve the grouped columns for this model
   * @returns The columns that are grouped
   */
  get groupedColumns(): Column[] {
    throw new Error('get groupedColumns not implemented');
  }

  /**
   * The description for this model.
   * @returns The description of the model
   */
  get description(): string {
    throw new Error('get description not implemented');
  }

  /**
   * @param column The model column index
   * @param row The model row index
   * @returns The format stored for that cell
   */
  formatForCell(column: ModelIndex, row: ModelIndex): Format | undefined {
    throw new Error('formatForCell not implemented');
  }

  /**
   * @param column The model column index
   * @param row The model row index
   * @returns The value stored for that cell
   */
  valueForCell(column: ModelIndex, row: ModelIndex): unknown {
    throw new Error('valueForCell not implemented');
  }

  /**
   * @returns The filters set on this model
   */
  get filter(): FilterCondition[] {
    throw new Error('get filter not implemented');
  }

  /**
   * @param filter The filters to set
   */
  set filter(filter: FilterCondition[]) {
    throw new Error('set filter not implemented');
  }

  /**
   * @returns {Formatter} The formatter used when formatting data
   */
  get formatter(): Formatter {
    throw new Error('get formatter not implemented');
  }

  /**
   * @param {Formatter} formatter The formatter to set
   */
  set formatter(formatter: Formatter) {
    throw new Error('set formatter not implemented');
  }

  /**
   * @param value The value to format
   * @param columnType The column type to format
   * @param columnName The column name to format
   */
  displayString(value: unknown, columnType: string, columnName = ''): string {
    throw new Error('displayString not implemented');
  }

  /**
   * @returns The sorts used on this model
   */
  get sort(): Sort[] {
    throw new Error('get sort not implemented');
  }

  /**
   * @param sort The sorts to use on this model
   */
  set sort(sort: Sort[]) {
    throw new Error('set sort not implemented');
  }

  /**
   * @returns The custom columns on this model
   */
  get customColumns(): string[] {
    throw new Error('get customColumns not implemented');
  }

  /**
   * @param customColumns The custom columns to use
   */
  set customColumns(customColumns: string[]) {
    throw new Error('set customColumns not implemented');
  }

  /**
   * @param columns The columns to treat as frozen
   */
  updateFrozenColumns(columns: string[]): void {
    throw new Error('updateFrozenColumns not implemented');
  }

  /**
   * @returns The config to use for rolling up this table
   */
  get rollupConfig(): RollupConfig {
    throw new Error('get rollupConfig not implemented');
  }

  set rollupConfig(rollupConfig: RollupConfig) {
    throw new Error('set rollupConfig not implemented');
  }

  /**
   * @returns The config to use for the totals table of this model
   */
  get totalsConfig(): TotalsTableConfig {
    throw new Error('get totalsConfig not implemented');
  }

  set totalsConfig(totalsConfig: TotalsTableConfig) {
    throw new Error('set totalsConfig not implemented');
  }

  /**
   * @returns The LayoutHints to use for the columns of this table model
   */
  get layoutHints(): LayoutHints | null {
    return null;
  }

  /**
   * @param index The column index to check
   * @returns Whether the column is one of LayoutHints' frozen columns
   */
  isColumnFrozen(index: ModelIndex): boolean {
    return false;
  }

  /**
   * @returns True if this model requires a filter to be set
   */
  get isFilterRequired(): boolean {
    return false;
  }

  get isReversible(): boolean {
    return true;
  }

  /**
   * @returns True if this model supports the columnStatistics(column) function
   */
  get isColumnStatisticsAvailable(): boolean {
    return false;
  }

  /**
   * @returns True if this model supports customColumns
   */
  get isCustomColumnsAvailable(): boolean {
    return false;
  }

  /**
   * @returns True if this model supports the export() function
   */
  get isExportAvailable(): boolean {
    return false;
  }

  /**
   * @returns True if this model supports the valuesTable(column) function
   */
  get isValuesTableAvailable(): boolean {
    return false;
  }

  /**
   * @returns True if this model should allow the chart builder
   */
  get isChartBuilderAvailable(): boolean {
    return false;
  }

  /**
   * @returns True if the rollup rows functionality is available
   */
  get isRollupAvailable(): boolean {
    return false;
  }

  /**
   * @return True if select distinct functionality is available
   */
  get isSelectDistinctAvailable(): boolean {
    return false;
  }

  /**
   * @returns True if the totals functionality is available
   */
  get isTotalsAvailable(): boolean {
    return false;
  }

  /**
   * The names of columns with select distinct enabled
   * @returns An array of column names
   */
  get selectDistinctColumns(): string[] {
    throw new Error('get selectDistinctColumns not implemented');
  }

  /**
   * Set the columns with select distinct enabled
   * @param names The array of column names to enable select distinct on
   */
  set selectDistinctColumns(names: string[]) {
    throw new Error('set selectDistinctColumns not implemented');
  }

  /**
   * The pending data for this model
   * @returns A map of row index to a map of column name/value pairs
   */
  get pendingDataMap(): Map<RowIndex, Map<string, unknown>> {
    throw new Error('get pendingDataMap not implemented');
  }

  /**
   * Set the pending data for this model
   * @param A map of row index to a map of column name/value pairs
   */
  set pendingDataMap(map: Map<RowIndex, Map<string, unknown>>) {
    throw new Error('set pendingDataMap not implemented');
  }

  /**
   * @returns The count of pending rows to show
   */
  get pendingRowCount(): number {
    throw new Error('get pendingRowCount not implemented');
  }

  /**
   * Set the count of pending rows to show
   * @param count The count of pending rows to show
   */
  set pendingRowCount(count: number) {
    throw new Error('set pendingRowCount not implemented');
  }

  /**
   * Errors for the pending data
   * @returns Map from row number to the error
   */
  get pendingDataErrors(): Map<RowIndex, Error> {
    throw new Error('get pendingDataErrors not implemented');
  }

  /**
   * Commit pending data and save all data to the table
   */
  async commitPending(): Promise<void> {
    throw new Error('commitPending not implemented');
  }

  /**
   * Check if a column is filterable
   * @param columnIndex The column index to check for filterability
   * @returns True if the current provided column index is filterable, false otherwise
   */
  isFilterable(columnIndex: ModelIndex): boolean {
    return false;
  }

  /**
   * Set the indices of the viewport
   * @param top Top of viewport
   * @param bottom Bottom of viewport
   * @param columns The columns in the viewport. `null` for all columns
   */
  setViewport(
    top: VisibleIndex,
    bottom: VisibleIndex,
    columns: Column[] | null
  ): void {
    throw new Error('setViewport not implemented');
  }

  /**
   * Takes a snapshot of the provided ranges
   * @param ranges The model ranges to take the snapshot of
   * @returns Returns the data in a row/column matrix
   */
  async snapshot(ranges: GridRange[]): Promise<unknown[][]> {
    throw new Error('snapshot not implemented');
  }

  /**
   * @param ranges The ranges to take a snapshot of
   * @param includeHeaders Whether to include the headers in the snapshot or not
   * @param {(unknown, dh.Column, dh.Row) => string} formatValue A function to format a value for a cell. Defaults to model format value.
   * @returns A text formatted snapshot of the data for the specified range set
   */
  async textSnapshot(
    ranges: GridRange[],
    includeHeaders = false,
    formatValue?: (value: unknown, column: Column, row: Row) => string
  ): Promise<string> {
    throw new Error('textSnapshot not implemented');
  }

  /**
   * @returns Returns a raw table that is frozen and can be used for exporting data
   */
  async export(): Promise<Table> {
    throw new Error('export not implemented');
  }

  /**
   * @param column The column to get the distinct values for
   * @returns A table partitioned on the column specified
   */
  async valuesTable(column: Column): Promise<Table> {
    throw new Error('getValuesTable not implemented');
  }

  /**
   * @param column The column to get statistics for
   * @returns The column statistics
   */
  async columnStatistics(column: Column): Promise<ColumnStatistics> {
    throw new Error('columnStatistics not implemented');
  }

  /**
   * Close this model. It can no longer be used after being closed
   */
  close(): void {
    // no-op
  }

  /**
   * Don't allow any rows to be movable in any IrisGrids by default. Just columns.
   */
  isRowMovable(): boolean {
    return false;
  }

  /**
   * Delete ranges from an input grid. Will delete the entire row, causing data to shift up
   * @param ranges The ranges to delete
   * @returns A promise that resolves successfully when the operation is complete or rejects if there's an error
   */
  delete(ranges: GridRange[]): Promise<void> {
    throw new Error('delete not implemented');
  }
}

export default IrisGridModel;
