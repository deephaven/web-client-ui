/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import { GridRange, type ModelIndex } from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { Formatter } from '@deephaven/jsapi-utils';
import {
  EventShimCustomEvent,
  PromiseUtils,
  assertNotNull,
  EMPTY_ARRAY,
} from '@deephaven/utils';
import IrisGridModel from './IrisGridModel';
import {
  type ColumnName,
  type UIRow,
  type UITotalsTableConfig,
} from './CommonTypes';
import IrisGridTableModelTemplate from './IrisGridTableModelTemplate';
import { type PartitionedGridModelProvider } from './PartitionedGridModel';

const log = Log.module('IrisGridTableModel');

/**
 * Model for a grid showing an iris data table
 */

class IrisGridTableModel
  extends IrisGridTableModelTemplate<DhType.Table, UIRow>
  implements PartitionedGridModelProvider
{
  userFrozenColumns?: ColumnName[];

  customColumnList: string[];

  formatColumnList: DhType.CustomColumn[];

  initialFilters: DhType.FilterCondition[] = [];

  // The initial value for table.isUncoalesced on the source table before any transformations (e.g. filter, select)
  wasUncoalesced: boolean;

  /**
   * @param dh JSAPI instance
   * @param table Iris data table to be used in the model
   * @param formatter The formatter to use when getting formats
   * @param inputTable Iris input table associated with this table
   */
  constructor(
    dh: typeof DhType,
    table: DhType.Table,
    formatter = new Formatter(dh),
    inputTable: DhType.InputTable | null = null
  ) {
    super(dh, table, formatter, inputTable);
    this.customColumnList = [];
    this.formatColumnList = [];
    this.initialFilters = table.filter;
    this.wasUncoalesced = this.isPartitionRequired;
  }

  get isExportAvailable(): boolean {
    return this.table.freeze != null;
  }

  get isColumnStatisticsAvailable(): boolean {
    return this.table.getColumnStatistics != null;
  }

  get isRollupAvailable(): boolean {
    return this.table.rollup != null;
  }

  get isSelectDistinctAvailable(): boolean {
    return this.table.selectDistinct != null;
  }

  get isOrganizeColumnsAvailable(): boolean {
    return true;
  }

  get isCustomColumnsAvailable(): boolean {
    return this.table.applyCustomColumns != null;
  }

  get isFormatColumnsAvailable(): boolean {
    return this.table.applyCustomColumns != null;
  }

  getMemoizedKeyColumnSet = memoize(
    (inputTableKeys?: readonly ColumnName[]) =>
      new Set(inputTableKeys ?? EMPTY_ARRAY)
  );

  get keyColumnSet(): Set<ColumnName> {
    return this.getMemoizedKeyColumnSet(this.inputTable?.keys);
  }

  getMemoizedFrontColumns = memoize(
    (layoutHintsFrontColumns: ColumnName[] | undefined) =>
      layoutHintsFrontColumns ?? EMPTY_ARRAY
  );

  get frontColumns(): readonly ColumnName[] {
    return this.getMemoizedFrontColumns(
      this.layoutHints?.frontColumns ?? undefined
    );
  }

  getMemoizedBackColumns = memoize(
    (layoutHintsBackColumns: ColumnName[] | undefined) =>
      layoutHintsBackColumns ?? EMPTY_ARRAY
  );

  get backColumns(): readonly ColumnName[] {
    return this.getMemoizedBackColumns(
      this.layoutHints?.backColumns ?? undefined
    );
  }

  getMemoizedFrozenColumns = memoize(
    (
      layoutHintsFrozenColumns?: ColumnName[],
      userFrozenColumns?: ColumnName[]
    ): readonly ColumnName[] =>
      userFrozenColumns ?? layoutHintsFrozenColumns ?? EMPTY_ARRAY
  );

  get frozenColumns(): readonly ColumnName[] {
    return this.getMemoizedFrozenColumns(
      this.layoutHints?.frozenColumns ?? undefined,
      this.userFrozenColumns
    );
  }

  get layoutHints(): DhType.LayoutHints | null | undefined {
    return this.table.layoutHints;
  }

  get floatingLeftColumnCount(): number {
    return this.frozenColumns.length;
  }

  get description(): string {
    return this.table.description ?? '';
  }

  get customColumns(): ColumnName[] {
    return this.customColumnList;
  }

  set customColumns(customColumns: ColumnName[]) {
    log.debug2(
      'set customColumns',
      customColumns,
      this.customColumnList,
      customColumns === this.customColumnList
    );
    if (this.customColumnList.length === 0 && customColumns.length === 0) {
      log.debug('Ignore empty initial customColumns');
      this.customColumnList = customColumns;
      return;
    }
    if (this.customColumnList === customColumns) {
      log.debug('Ignore same customColumns');
      return;
    }
    this.closeSubscription();
    this.customColumnList = customColumns;
    this.table.applyCustomColumns([...customColumns, ...this.formatColumns]);
    this.applyViewport();
  }

  get formatColumns(): DhType.CustomColumn[] {
    return this.formatColumnList;
  }

  set formatColumns(formatColumns: DhType.CustomColumn[]) {
    log.debug2(
      'set formatColumns',
      formatColumns,
      this.formatColumnList,
      formatColumns === this.formatColumnList
    );
    if (this.formatColumnList.length === 0 && formatColumns.length === 0) {
      log.debug('Ignore empty initial formatColumns');
      this.formatColumnList = formatColumns;
      return;
    }
    if (this.formatColumnList === formatColumns) {
      log.debug('Ignore same formatColumns');
      return;
    }
    this.closeSubscription();
    this.formatColumnList = formatColumns;
    this.table.applyCustomColumns([...this.customColumns, ...formatColumns]);
    this.applyViewport();
  }

  updateFrozenColumns(columns: ColumnName[]): void {
    this.userFrozenColumns = columns;
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: this.columns,
      })
    );
  }

  get partitionColumns(): readonly DhType.Column[] {
    return this.getCachedPartitionColumns(this.columns);
  }

  async partitionKeysTable(): Promise<DhType.Table> {
    return this.valuesTable(this.partitionColumns);
  }

  async partitionMergedTable(): Promise<DhType.Table> {
    const t = await this.table.copy();
    t.applyFilter([]);
    return t;
  }

  async partitionBaseTable(): Promise<DhType.Table> {
    return this.partitionKeysTable();
  }

  async partitionTable(partitions: unknown[]): Promise<DhType.Table> {
    log.debug('getting partition table for partitions', partitions);

    const partitionFilters: DhType.FilterCondition[] = [];
    for (let i = 0; i < this.partitionColumns.length; i += 1) {
      const partition = partitions[i];
      const partitionColumn = this.partitionColumns[i];
      const partitionFilter = this.tableUtils.makeNullableEqFilter(
        partitionColumn,
        partition
      );
      partitionFilters.push(partitionFilter);
    }

    const t = await this.table.copy();
    t.applyFilter([...this.initialFilters, ...partitionFilters]);
    return t;
  }

  set filter(filter: DhType.FilterCondition[]) {
    this.closeSubscription();
    this.table.applyFilter([...this.initialFilters, ...filter]);
    this.applyViewport();
  }

  set totalsConfig(totalsConfig: UITotalsTableConfig | null) {
    log.debug('set totalsConfig', totalsConfig);

    if (totalsConfig === this.totals) {
      // Totals already set, or it will be set when the next model actually gets set
      return;
    }

    this.totals = totalsConfig;
    this.formattedStringData = [];

    if (this.totalsTablePromise != null) {
      this.totalsTablePromise.cancel();
    }

    this.setTotalsTable(null);

    if (totalsConfig == null) {
      this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
      return;
    }

    this.totalsTablePromise = PromiseUtils.makeCancelable(
      this.table.getTotalsTable(totalsConfig),
      table => table.close()
    );
    this.totalsTablePromise
      .then(totalsTable => {
        this.totalsTablePromise = null;
        this.setTotalsTable(totalsTable);
      })
      .catch(err => {
        if (PromiseUtils.isCanceled(err)) {
          return;
        }

        log.error('Unable to set next totalsTable', err);
        this.totalsTablePromise = null;

        this.dispatchEvent(
          new EventShimCustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, {
            detail: err,
          })
        );
      });
  }

  get isFilterRequired(): boolean {
    return this.table.isUncoalesced;
  }

  get isPartitionRequired(): boolean {
    return (
      this.table.isUncoalesced &&
      this.isValuesTableAvailable &&
      this.partitionColumns.length > 0
    );
  }

  get isPartitionAwareSourceTable(): boolean {
    return this.wasUncoalesced;
  }

  isFilterable(columnIndex: ModelIndex): boolean {
    return this.getCachedFilterableColumnSet(this.columns).has(columnIndex);
  }

  async export(): Promise<DhType.Table> {
    return this.table.freeze();
  }

  columnStatistics(column: DhType.Column): Promise<DhType.ColumnStatistics> {
    return this.table.getColumnStatistics(column);
  }

  getCachedFilterableColumnSet = memoize(
    (columns: DhType.Column[]) =>
      new Set(columns.map((_: DhType.Column, index: ModelIndex) => index))
  );

  getCachedPartitionColumns = memoize((columns: readonly DhType.Column[]) =>
    columns.filter(column => column.isPartitionColumn)
  );

  isColumnMovable(modelIndex: ModelIndex): boolean {
    const columnName = this.columns[modelIndex].name;
    if (
      this.frontColumns.includes(columnName) ||
      this.backColumns.includes(columnName) ||
      this.frozenColumns.includes(columnName)
    ) {
      return false;
    }
    return !this.isKeyColumn(modelIndex);
  }

  isColumnFrozen(modelIndex: ModelIndex): boolean {
    return this.frozenColumns.includes(this.columns[modelIndex].name);
  }

  async delete(ranges: readonly GridRange[]): Promise<void> {
    if (!this.isDeletableRanges(ranges)) {
      throw new Error(`Undeletable ranges ${ranges}`);
    }

    assertNotNull(this.inputTable);
    const { keyColumns } = this.inputTable;
    if (this.keyColumnSet.size === 0) {
      throw new Error('No key columns to allow deletion');
    }

    const pendingAreaRange = this.getPendingAreaRange();
    const pendingRanges = ranges
      .map(range => GridRange.intersection(pendingAreaRange, range))
      .filter(range => range != null)
      .map(range => {
        assertNotNull(range);

        return GridRange.offset(
          range,
          0,
          -(this.floatingTopRowCount + this.table.size)
        );
      });

    if (pendingRanges.length > 0) {
      const newDataMap = new Map(super.pendingDataMap);
      for (let i = 0; i < pendingRanges.length; i += 1) {
        const pendingRange = pendingRanges[i];
        assertNotNull(pendingRange.startRow);
        assertNotNull(pendingRange.endRow);
        for (let r = pendingRange.startRow; r <= pendingRange.endRow; r += 1) {
          newDataMap.delete(r);
        }
      }
      super.pendingDataMap = newDataMap;

      this.formattedStringData = [];

      this.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.PENDING_DATA_UPDATED)
      );

      this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
    }

    const tableAreaRange = this.getTableAreaRange();
    const tableRanges = ranges
      .map(range => GridRange.intersection(tableAreaRange, range))
      .filter(range => range != null);
    if (tableRanges.length <= 0) {
      return;
    }

    const [data, deleteTable] = await Promise.all([
      // Need to get the key values of each row
      this.snapshot(
        tableRanges
          .map(range => {
            assertNotNull(range);
            // Need to map each key column to it's range so we can pass that into the snapshot function
            return keyColumns.map(keyColumn => {
              const keyIndex = this.getColumnIndexByName(keyColumn.name);
              if (keyIndex == null) {
                throw new Error(`Key column ${keyColumn.name} not found`);
              }

              return new GridRange(
                keyIndex,
                range.startRow,
                keyIndex,
                range.endRow
              );
            });
          })
          .flat()
      ),
      this.table.copy(),
    ]);

    // Now copy the existing table and filter it on the values in the snapshot for the key columns in the input table
    const filters = data.map(row => {
      const columnFilters = [];
      for (let c = 0; c < keyColumns.length; c += 1) {
        const column = keyColumns[c];
        const value = row[c];
        const filter = this.tableUtils.makeNullableEqFilter(column, value);
        columnFilters.push(filter);
      }
      return columnFilters.reduce((agg, curr) => agg?.and(curr) ?? curr);
    });

    const filter = filters.reduce((agg, curr) => agg?.or(curr) ?? curr);

    deleteTable.applyFilter([filter]);

    await this.inputTable?.deleteTable(deleteTable);
    deleteTable.close();
  }

  async seekRow(
    startRow: number,
    column: DhType.Column,
    valueType: DhType.ValueTypeType,
    value: unknown,
    insensitive?: boolean,
    contains?: boolean,
    isBackwards?: boolean
  ): Promise<number> {
    return this.table.seekRow(
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
    return this.table.seekRow != null;
  }
}

export default IrisGridTableModel;
