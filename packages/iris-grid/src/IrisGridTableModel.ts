/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import {
  EditOperation,
  GridRange,
  GridUtils,
  memoizeClear,
  ModelIndex,
  VisibleIndex,
} from '@deephaven/grid';
import dh, {
  Column,
  ColumnStatistics,
  CustomColumn,
  Format,
  InputTable,
  LayoutHints,
  Table,
} from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import {
  CancelablePromise,
  EventShimCustomEvent,
  PromiseUtils,
} from '@deephaven/utils';
import { ViewportData } from '@deephaven/storage';
import { Formatter, FormatterUtils, TableUtils } from '@deephaven/jsapi-utils';
import IrisGridModel from './IrisGridModel';
import {
  assertNotNull,
  assertNotUndefined,
  UITotalsTableConfig,
} from './IrisGrid';
import IrisGridTableModelTemplate from './IrisGridTableModelTemplate';

const log = Log.module('IrisGridTableModel');

export interface UIRow {
  data: Map<ModelIndex, CellData>;
}

export type UIViewportData<R extends UIRow = UIRow> = {
  offset: number;
  rows: R[];
};
export type RowData<T = unknown> = Map<number, { value: T }>;

export type CellData = {
  value: unknown;
  format?: Format;
};
export type PendingDataMap<R extends UIRow = UIRow> = Map<ModelIndex, R>;

/**
 * Model for a grid showing an iris data table
 */
class IrisGridTableModel extends IrisGridTableModelTemplate<Table, UIRow> {
  static ROW_BUFFER_PAGES = 1;

  static COLUMN_BUFFER_PAGES = 0;

  userFrozenColumns: string[] | null;

  /**
   * @param {dh.Table} table Iris data table to be used in the model
   * @param {Formatter} formatter The formatter to use when getting formats
   * @param {dh.InputTable} inputTable Iris input table associated with this table
   */
  constructor(
    table: Table,
    formatter = new Formatter(),
    inputTable: InputTable | null = null
  ) {
    super(table, formatter, inputTable);

    this.userFrozenColumns = null;
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

  /**
   * Returns an array of the columns in the model
   * The order of model columns should never change once established
   */
  get columns() {
    return this.table.columns;
  }

  /**
   * Used to get the initial moved columns based on layout hints
   */
  get movedColumns() {
    let movedColumns = [];

    if (
      this.frontColumns.length ||
      this.backColumns.length ||
      this.frozenColumns.length
    ) {
      const usedColumns = new Set();

      const moveColumn = (name, index) => {
        if (usedColumns.has(name)) {
          throw new Error(`Column specified in multiple layout hints: ${name}`);
        }
        const modelIndex = this.getColumnIndexByName(name);
        if (!modelIndex) {
          throw new Error(`Unknown layout hint column: ${name}`);
        }
        const visibleIndex = GridUtils.getVisibleIndex(
          modelIndex,
          movedColumns
        );
        movedColumns = GridUtils.moveItem(visibleIndex, index, movedColumns);
      };

      let frontIndex = 0;
      this.frozenColumns.forEach(name => {
        moveColumn(name, frontIndex);
        frontIndex += 1;
      });
      this.frontColumns.forEach(name => {
        moveColumn(name, frontIndex);
        frontIndex += 1;
      });

      let backIndex = this.columnMap.size - 1;
      this.backColumns.forEach(name => {
        moveColumn(name, backIndex);
        backIndex -= 1;
      });
    }
    return movedColumns;
  }

  getMemoizedFrontColumns = memoize(
    layoutHintsFrontColumns => layoutHintsFrontColumns ?? []
  );

  get frontColumns(): string[] {
    return this.getMemoizedFrontColumns(this.layoutHints?.frontColumns);
  }

  getMemoizedBackColumns = memoize(
    layoutHintsBackColumns => layoutHintsBackColumns ?? []
  );

  get backColumns(): string[] {
    return this.getMemoizedBackColumns(this.layoutHints?.backColumns);
  }

  getMemoizedFrozenColumns = memoize(
    (
      layoutHintsFrozenColumns: string[],
      userFrozenColumns: string[] | null
    ): string[] => userFrozenColumns ?? layoutHintsFrozenColumns ?? []
  );

  get frozenColumns(): string[] {
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

  get customColumns(): string[] {
    return this.customColumnList;
  }

  set customColumns(customColumns: string[]) {
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

  updateFrozenColumns(columns: string[]): void {
    this.userFrozenColumns = columns;
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.TABLE_CHANGED)
    );
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

  isFilterable(columnIndex: number): boolean {
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
      new Set(columns.map((_: Column, index: number) => index))
  );

  getCachedFormattedString = memoizeClear(
    (
      formatter: Formatter,
      value: unknown,
      columnType: string,
      columnName: string,
      formatOverride?: { formatString: string }
    ): string =>
      formatter.getFormattedString(
        value,
        columnType,
        columnName,
        formatOverride
      ),
    { max: 10000 }
  );

  getCachedCustomColumnFormatFlag = memoizeClear(
    FormatterUtils.isCustomColumnFormatDefined,
    { max: 10000 }
  );

  getCachedViewportRowRange = memoize((top: number, bottom: number): [
    number,
    number
  ] => {
    const viewHeight = bottom - top;
    const viewportTop = Math.max(
      0,
      top - viewHeight * IrisGridTableModel.ROW_BUFFER_PAGES
    );
    const viewportBottom =
      bottom + viewHeight * IrisGridTableModel.ROW_BUFFER_PAGES;
    return [viewportTop, viewportBottom];
  });

  getCachedPendingErrors = memoize(
    (
      pendingDataMap: PendingDataMap,
      columns: Column[],
      keyColumnCount: number
    ) => {
      const map = new Map<number, MissingKeyError[]>();
      pendingDataMap.forEach((row, rowIndex) => {
        const { data: rowData } = row;
        for (let i = 0; i < keyColumnCount; i += 1) {
          if (!rowData.has(i)) {
            if (!map.has(rowIndex)) {
              map.set(rowIndex, []);
            }
            map
              .get(rowIndex)
              ?.push(new MissingKeyError(rowIndex, columns[i].name));
          }
        }
      });
      return map;
    }
  );

  isColumnMovable(modelIndex: number): boolean {
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

  isColumnFrozen(modelIndex: number): boolean {
    return this.frozenColumns.includes(this.columns[modelIndex].name);
  }

  async delete(ranges: GridRange[]): Promise<void> {
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
      const newDataMap = new Map(this.pendingNewDataMap);
      for (let i = 0; i < pendingRanges.length; i += 1) {
        const pendingRange = pendingRanges[i];
        for (
          let r = pendingRange.startRow as number;
          r <= (pendingRange.endRow as number);
          r += 1
        ) {
          newDataMap.delete(r);
        }
      }
      this.pendingNewDataMap = newDataMap;

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
        tableRanges.map(range => {
          assertNotNull(range);
          return new GridRange(
            0,
            range.startRow,
            keyColumns.length - 1,
            range.endRow
          );
        })
      ),
      this.table.copy(),
    ]);

    // Now copy the existing table and filter it on the values in the snapshot for the key columns in the input table
    const filters = data.map(row => {
      const columnFilters = [];
      for (let c = 0; c < keyColumns.length; c += 1) {
        const column = keyColumns[c];
        const value = row[c];
        const filterValue = TableUtils.makeFilterRawValue(column.type, value);
        const filter = column.filter().eq(filterValue);
        columnFilters.push(filter);
      }
      return columnFilters.reduce((agg, curr) => (agg ? agg.and(curr) : curr));
    });

    const filter = filters.reduce((agg, curr) => (agg ? agg.or(curr) : curr));
    deleteTable.applyFilter([filter]);

    await this.inputTable?.deleteTable(deleteTable);
    deleteTable.close();
  }
}

export default IrisGridTableModel;
