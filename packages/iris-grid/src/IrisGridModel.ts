/* eslint-disable class-methods-use-this */
import type { Event, EventTarget } from 'event-target-shim';
import {
  type BoundedAxisRange,
  type DataBarGridModel,
  type DataBarOptions,
  type GridCell,
  GridModel,
  type GridRange,
  type GridRangeIndex,
  type GridThemeType,
  type ModelIndex,
  type MoveOperation,
  type VisibleIndex,
} from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { type Formatter } from '@deephaven/jsapi-utils';
import {
  type ColumnName,
  type UITotalsTableConfig,
  type PendingDataMap,
  type PendingDataErrorMap,
} from './CommonTypes';
import type ColumnHeaderGroup from './ColumnHeaderGroup';

export type DisplayColumn = DhType.Column & {
  /**
   * Name to display with the column.
   * The `name` property on `Column` is a unique identifier and must be a valid Java identifier,
   * whereas `displayName` can be any string and does not need to be unique.
   */
  displayName?: string;

  /**
   * Whether this column is a proxy column for other columns or not.
   * If it's a proxy column, it may not appear in some lists.
   */
  isProxy?: boolean;
};

type IrisGridModelEventNames =
  (typeof IrisGridModel.EVENT)[keyof typeof IrisGridModel.EVENT];

type IrisGridModelEventMap = {
  [E in IrisGridModelEventNames]: Event<E>;
};

const EMPTY_ARRAY: never[] = [];
const EMPTY_SET: Set<never> = new Set();

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
    TMode extends 'standard' | 'strict' = 'standard',
  >
  extends GridModel<TEventMap & IrisGridModelEventMap, TMode>
  implements DataBarGridModel
{
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
    /** Fired when the viewport is applied to the table and we're waiting for a response. */
    PENDING_DATA_UPDATED: 'PENDING_DATA_UPDATED',
    VIEWPORT_UPDATED: 'VIEWPORT_UPDATED',
  } as const);

  constructor(dh: typeof DhType) {
    super();

    this.dh = dh;
    this.listenerCount = 0;
  }

  dh: typeof DhType;

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
  abstract get columns(): readonly DisplayColumn[];

  /**
   * Retrieve the grouped columns for this model
   * @returns The columns that are grouped
   */
  get groupedColumns(): readonly DisplayColumn[] {
    return EMPTY_ARRAY;
  }

  /**
   * Gets the columns for the model before any transformations (such as rollups) are applied.
   * @returns All original columns in the model.
   */
  get originalColumns(): readonly DisplayColumn[] {
    return this.columns;
  }

  /**
   * Gets the column index for this model
   * @param name The model column name.
   * @returns The numeric index of the requested column.
   */
  abstract getColumnIndexByName(name: string): ModelIndex | undefined;

  /**
   * Retrieve the source cell for a given cell. Returns something different if the cell is a proxied cell
   * that retrieves data from another cell.
   * @param column Column to get the source for
   * @param row Row to get the source for
   * @returns Source cell where the data is coming from
   */
  sourceForCell(column: ModelIndex, row: ModelIndex): GridCell {
    return { column, row };
  }

  /**
   * Retrieve the range of columns to clear filters on for a given column.
   * @param column Column to get the range of filters to clear.
   * @returns Axis range of the column filters to clear, or `null` if this should not have a clear filter option.
   */
  getClearFilterRange(column: ModelIndex): BoundedAxisRange | null {
    if (this.isFilterable(column)) {
      return [column, column];
    }
    return null;
  }

  /** List of column movements defined by the model. Used as initial movements for IrisGrid */
  get initialMovedColumns(): readonly MoveOperation[] {
    return EMPTY_ARRAY;
  }

  /** List of row movements defined by the model. Used as initial movements for IrisGrid */
  get initialMovedRows(): readonly MoveOperation[] {
    return EMPTY_ARRAY;
  }

  /** List of column header groups defined by the model */
  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return EMPTY_ARRAY;
  }

  /**
   * @param column The model column index
   * @param row The model row index
   * @returns The format stored for that cell
   */
  abstract formatForCell(
    column: ModelIndex,
    row: ModelIndex
  ): DhType.Format | undefined;

  /**
   * @param column The model column index
   * @param row The model row index
   * @returns The value stored for that cell
   */
  abstract valueForCell(column: ModelIndex, row: ModelIndex): unknown;

  /**
   * @returns The filters set on this model
   */
  abstract get filter(): readonly DhType.FilterCondition[];

  /**
   * @param filter The filters to set
   */
  abstract set filter(filter: readonly DhType.FilterCondition[]);

  /**
   * @returns The formatter used when formatting data
   */
  abstract get formatter(): Formatter;

  /**
   * @param formatter The formatter to set
   */
  abstract set formatter(formatter: Formatter);

  /**
   * @param value The value to format
   * @param columnType The column type to format
   * @param columnName The column name to format
   */
  abstract displayString(
    value: unknown,
    columnType: string,
    columnName?: ColumnName
  ): string;

  /**
   * @returns The sorts used on this model
   */
  abstract get sort(): readonly DhType.Sort[];

  /**
   * @param sort The sorts to use on this model
   */
  abstract set sort(sort: readonly DhType.Sort[]);

  /**
  /**
   * @returns The custom columns on this model
   */
  abstract get customColumns(): readonly ColumnName[];

  /**
   * @param customColumns The custom columns to use
   */
  abstract set customColumns(customColumns: readonly ColumnName[]);

  /**
   * @returns The format columns on this model
   */
  abstract get formatColumns(): readonly DhType.CustomColumn[];

  /**
   * @param formatColumns The format columns to use
   */
  abstract set formatColumns(formatColumns: readonly DhType.CustomColumn[]);

  /**
   * @param columns The columns to treat as frozen
   */
  abstract updateFrozenColumns(columns: readonly ColumnName[]): void;

  /**
   * @returns The config to use for rolling up this table
   */
  abstract get rollupConfig(): DhType.RollupConfig | null;

  abstract set rollupConfig(rollupConfig: DhType.RollupConfig | null);

  /**
   * @returns The config to use for the totals table of this model
   */
  abstract get totalsConfig(): UITotalsTableConfig | null;

  abstract set totalsConfig(totalsConfig: UITotalsTableConfig | null);

  /**
   * @returns The LayoutHints to use for the columns of this table model
   */
  get layoutHints(): DhType.LayoutHints | null | undefined {
    return null;
  }

  /**
   * @returns Names of columns which should be locked to the front, but not floating
   */
  get frontColumns(): readonly ColumnName[] {
    return EMPTY_ARRAY;
  }

  /**
   * @returns Names of columns which should be locked to the back, but not floating
   */
  get backColumns(): readonly ColumnName[] {
    return EMPTY_ARRAY;
  }

  /**
   * @returns Names of key columns
   */
  get keyColumnSet(): Set<ColumnName> {
    return EMPTY_SET;
  }

  /**
   * @returns Names of columns which should be frozen to the front and floating
   */
  get frozenColumns(): readonly ColumnName[] {
    return EMPTY_ARRAY;
  }

  /**
   * @param index The column index to check
   * @returns Whether the column is one of LayoutHints' frozen columns
   */
  isColumnFrozen(index: ModelIndex): boolean {
    return false;
  }

  /**
   * @param index The column index to check
   * @returns Whether the column is sortable
   */
  isColumnSortable(index: ModelIndex): boolean {
    return false;
  }

  /**
   * @deprecated Replaced with isPartitionRequired()
   * @returns True if this model requires a filter to be set
   */
  get isFilterRequired(): boolean {
    return false;
  }

  get isReversible(): boolean {
    return true;
  }

  /**
   * @returns Returns a raw table that is frozen and can be used for exporting data
   */
  abstract export(): Promise<DhType.Table>;

  /**
   * @returns True if this model supports the columnStatistics(column) function
   */
  get isColumnStatisticsAvailable(): boolean {
    return false;
  }

  /**
   * The description for this model.
   * @returns The description of the model
   */
  get description(): string {
    return '';
  }

  /**
   * @param column The column to get statistics for
   * @returns The column statistics
   */
  abstract columnStatistics(
    column: DhType.Column
  ): Promise<DhType.ColumnStatistics>;

  /**
   * @returns True if this model supports customColumns
   */
  get isCustomColumnsAvailable(): boolean {
    return false;
  }

  /**
   * @returns True if this model supports customColumns
   */
  get isFormatColumnsAvailable(): boolean {
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
   * @returns True if select distinct functionality is available
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
  abstract get selectDistinctColumns(): readonly ColumnName[];

  /**
   * Set the columns with select distinct enabled
   * @param names The array of column names to enable select distinct on
   */
  abstract set selectDistinctColumns(names: readonly ColumnName[]);

  /**
   * The pending data for this model
   * @returns A map of row index to a map of column name/value pairs
   */
  abstract get pendingDataMap(): PendingDataMap;

  /**
   * Set the pending data for this model
   * @param A map of row index to a map of column name/value pairs
   */
  abstract set pendingDataMap(map: PendingDataMap);

  /**
   * @returns The count of pending rows to show
   */
  abstract get pendingRowCount(): number;

  /**
   * Set the count of pending rows to show
   * @param count The count of pending rows to show
   */
  abstract set pendingRowCount(count: number);

  /**
   * Errors for the pending data
   * @returns Map from row number to the error
   */
  abstract get pendingDataErrors(): PendingDataErrorMap;

  /**
   * Commit pending data and save all data to the table
   */
  abstract commitPending(): Promise<void>;

  /**
   * Check if viewport is still loading data
   */
  get isViewportPending(): boolean {
    return false;
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
   * @param columns The columns in the viewport. `undefined` for all columns
   */
  abstract setViewport(
    top: VisibleIndex,
    bottom: VisibleIndex,
    columns?: DhType.Column[]
  ): void;

  /**
   * Takes a snapshot of the provided ranges
   * @param ranges The model ranges to take the snapshot of
   * @returns Returns the data in a row/column matrix
   */
  abstract snapshot(
    ranges: readonly GridRange[]
  ): Promise<readonly unknown[][]>;

  /**
   * @param ranges The ranges to take a snapshot of
   * @param includeHeaders Whether to include the headers in the snapshot or not
   * @param formatValue A function to format a value for a cell. Defaults to model format value.
   * @returns A text formatted snapshot of the data for the specified range set
   */
  abstract textSnapshot(
    ranges: readonly GridRange[],
    includeHeaders?: boolean,
    formatValue?: (
      value: unknown,
      column: DhType.Column,
      row?: DhType.Row
    ) => string
  ): Promise<string>;

  /**
   * @param column The columns to get the distinct values for
   * @returns A table partitioned on the specified columns in the order given in
   */
  abstract valuesTable(
    columns: DhType.Column | readonly DhType.Column[]
  ): Promise<DhType.Table>;

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

  abstract seekRow(
    startRow: number,
    column: DhType.Column,
    valueType: DhType.ValueTypeType,
    value: unknown,
    insensitive?: boolean,
    contains?: boolean,
    isBackwards?: boolean
  ): Promise<number>;

  get isSeekRowAvailable(): boolean {
    return false;
  }

  abstract get columnHeaderGroups(): readonly ColumnHeaderGroup[];

  abstract set columnHeaderGroups(groups: readonly ColumnHeaderGroup[]);

  abstract get columnHeaderGroupMap(): ReadonlyMap<string, ColumnHeaderGroup>;

  abstract getColumnHeaderParentGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ColumnHeaderGroup | undefined;

  dataBarOptionsForCell(
    column: number,
    row: number,
    theme: GridThemeType
  ): DataBarOptions {
    throw new Error('Method not implemented.');
  }

  tooltipForCell(column: GridRangeIndex, row: GridRangeIndex): string | null {
    return null;
  }
}

export default IrisGridModel;
