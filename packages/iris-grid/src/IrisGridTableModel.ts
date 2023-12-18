/* eslint-disable no-underscore-dangle */
/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import { GridRange, ModelIndex } from '@deephaven/grid';
import type {
  Column,
  ColumnStatistics,
  CustomColumn,
  dh as DhType,
  FilterCondition,
  InputTable,
  LayoutHints,
  Table,
  ValueTypeUnion,
} from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import {
  EventShimCustomEvent,
  PromiseUtils,
  assertNotNull,
} from '@deephaven/utils';
import IrisGridModel from './IrisGridModel';
import { ColumnName, UIRow, UITotalsTableConfig } from './CommonTypes';
import IrisGridTableModelTemplate from './IrisGridTableModelTemplate';
import { PartitionConfig, PartitionedGridModel } from './PartitionedGridModel';

const log = Log.module('IrisGridTableModel');

/**
 * Model for a grid showing an iris data table
 */

class IrisGridTableModel
  extends IrisGridTableModelTemplate<Table, UIRow>
  implements PartitionedGridModel
{
  userFrozenColumns?: ColumnName[];

  customColumnList: string[];

  formatColumnList: CustomColumn[];

  private initialUncoalesced: boolean;

  private _partitionConfig: PartitionConfig;

  private _partitionColumns: Column[];

  private partitionFilters: FilterCondition[] = [];

  private partitionTablePromise?: Promise<Table>;

  private _partitionTable?: Table;

  /**
   * @param dh JSAPI instance
   * @param table Iris data table to be used in the model
   * @param formatter The formatter to use when getting formats
   * @param inputTable Iris input table associated with this table
   */
  constructor(
    dh: DhType,
    table: Table,
    formatter = new Formatter(dh),
    inputTable: InputTable | null = null
  ) {
    super(dh, table, formatter, inputTable);
    this.customColumnList = [];
    this.formatColumnList = [];
    this.initialUncoalesced = this.table.isUncoalesced;
    this._partitionColumns = this.table.columns.filter(
      c => c.isPartitionColumn
    );
    this._partitionConfig = {
      partitions: [],
      mode: 'partition',
    };
    if (this.table.isUncoalesced && this.isValuesTableAvailable) {
      this.partitionTablePromise = this.initializePartitionModel();
    }
  }

  close(): void {
    super.close();
    this._partitionTable?.close();
  }

  get isExportAvailable(): boolean {
    return this.table.freeze != null;
  }

  get isColumnStatisticsAvailable(): boolean {
    return this.table.getColumnStatistics != null;
  }

  get isValuesTableAvailable(): boolean {
    return this.table.selectDistinct != null && this.table.copy != null;
  }

  get isRollupAvailable(): boolean {
    return this.table.rollup != null;
  }

  get isSelectDistinctAvailable(): boolean {
    return this.table.selectDistinct != null;
  }

  get isCustomColumnsAvailable(): boolean {
    return this.table.applyCustomColumns != null;
  }

  get isFormatColumnsAvailable(): boolean {
    return this.table.applyCustomColumns != null;
  }

  getMemoizedFrontColumns = memoize(
    (layoutHintsFrontColumns: ColumnName[] | undefined) =>
      layoutHintsFrontColumns ?? []
  );

  get frontColumns(): ColumnName[] {
    return this.getMemoizedFrontColumns(this.layoutHints?.frontColumns);
  }

  getMemoizedBackColumns = memoize(
    (layoutHintsBackColumns: ColumnName[] | undefined) =>
      layoutHintsBackColumns ?? []
  );

  get backColumns(): ColumnName[] {
    return this.getMemoizedBackColumns(this.layoutHints?.backColumns);
  }

  getMemoizedFrozenColumns = memoize(
    (
      layoutHintsFrozenColumns?: ColumnName[],
      userFrozenColumns?: ColumnName[]
    ): ColumnName[] => userFrozenColumns ?? layoutHintsFrozenColumns ?? []
  );

  get frozenColumns(): ColumnName[] {
    return this.getMemoizedFrozenColumns(
      this.layoutHints?.frozenColumns,
      this.userFrozenColumns
    );
  }

  get layoutHints(): LayoutHints {
    return this.table.layoutHints;
  }

  get floatingLeftColumnCount(): number {
    return this.frozenColumns.length;
  }

  get description(): string {
    return this.table.description;
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

  get formatColumns(): CustomColumn[] {
    return this.formatColumnList;
  }

  set formatColumns(formatColumns: CustomColumn[]) {
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
      new EventShimCustomEvent(IrisGridModel.EVENT.TABLE_CHANGED, {
        detail: this.table,
      })
    );
  }

  get partitionColumns(): readonly Column[] {
    return this._partitionColumns;
  }

  get partitionConfig(): PartitionConfig {
    return this._partitionConfig;
  }

  set partitionConfig(partitionConfig: PartitionConfig) {
    log.log('setting partition', partitionConfig);
    const { partitions, mode } = partitionConfig;
    const partitionFilters = [];

    if (mode === 'partition') {
      for (let i = 0; i < this.partitionColumns.length; i += 1) {
        const partition = partitions[i];
        const partitionColumn = this.partitionColumns[i];

        if (
          partition != null &&
          !(TableUtils.isCharType(partitionColumn.type) && partition === '')
        ) {
          const partitionText = TableUtils.isCharType(partitionColumn.type)
            ? this.displayString(
                partition,
                partitionColumn.type,
                partitionColumn.name
              )
            : partition.toString();
          const partitionFilter = this.tableUtils.makeQuickFilterFromComponent(
            partitionColumn,
            partitionText
          );
          if (partitionFilter !== null) {
            partitionFilters.push(partitionFilter);
          }
        }
      }
    }

    const prevFilters = super.filter.slice(
      0,
      super.filter.length - this.partitionFilters.length
    );
    this._partitionConfig = partitionConfig;
    this.partitionFilters = partitionFilters;
    this.filter = prevFilters;
  }

  partitionKeysTable(): Promise<Table> {
    if (this._partitionTable !== undefined) {
      return this._partitionTable.copy();
    }
    if (this.partitionTablePromise !== undefined) {
      return this.partitionTablePromise.then(table => table.copy());
    }
    throw new Error('Partition table not initialized');
  }

  set filter(filter: FilterCondition[]) {
    this.closeSubscription();
    this.table.applyFilter([...filter, ...this.partitionFilters]);
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
    return this.initialUncoalesced;
  }

  get isPartitionRequired(): boolean {
    return this.initialUncoalesced && this.isValuesTableAvailable;
  }

  isFilterable(columnIndex: ModelIndex): boolean {
    return this.getCachedFilterableColumnSet(this.columns).has(columnIndex);
  }

  async export(): Promise<Table> {
    return this.table.freeze();
  }

  columnStatistics(column: Column): Promise<ColumnStatistics> {
    return this.table.getColumnStatistics(column);
  }

  getCachedFilterableColumnSet = memoize(
    (columns: Column[]) =>
      new Set(columns.map((_: Column, index: ModelIndex) => index))
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
    if (keyColumns.length === 0) {
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
        const filterValue = this.tableUtils.makeFilterRawValue(
          column.type,
          value
        );
        const filter = column.filter().eq(filterValue);
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
    column: Column,
    valueType: ValueTypeUnion,
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

  private async initializePartitionModel(): Promise<Table> {
    const partitionTable = await this.valuesTable(this._partitionColumns);

    const columns = partitionTable.columns.slice(
      0,
      this._partitionColumns.length
    );
    const sorts = columns.map(column => column.sort().desc());
    partitionTable.applySort(sorts);
    partitionTable.setViewport(0, 0, columns);

    const data = await partitionTable.getViewportData();
    if (
      data.rows.length > 0 &&
      this._partitionConfig.partitions.length === 0 &&
      this._partitionConfig.mode === 'partition'
    ) {
      const row = data.rows[0];
      const values = columns.map(column => row.get(column));

      this.partitionConfig = {
        partitions: values,
        mode: 'partition',
      };
    }
    this._partitionTable = partitionTable;
    return partitionTable;
  }
}

export default IrisGridTableModel;
