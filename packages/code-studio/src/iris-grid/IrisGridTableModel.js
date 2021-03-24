/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import { GridRange } from '@deephaven/grid';
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import { PromiseUtils } from '@deephaven/utils';
import memoizeClear from '../include/memoizeClear';
import TableUtils from './TableUtils';
import Formatter from './Formatter';
import { TableColumnFormatter } from './formatters';
import IrisGridModel from './IrisGridModel';
import AggregationOperation from './sidebar/aggregations/AggregationOperation.ts';
import IrisGridUtils from './IrisGridUtils';

const log = Log.module('IrisGridTableModel');

const SET_VIEWPORT_THROTTLE = 150;
const APPLY_VIEWPORT_THROTTLE = 0;

/**
 * Model for a grid showing an iris data table
 */
class IrisGridTableModel extends IrisGridModel {
  static ROW_BUFFER_PAGES = 1;

  static COLUMN_BUFFER_PAGES = 0;

  /**
   * @param {dh.Table} table Iris data table to be used in the model
   * @param {Formatter} formatter The formatter to use when getting formats
   * @param {dh.InputTable} inputTable Iris input table associated with this table
   */
  constructor(table, formatter = new Formatter(), inputTable = null) {
    super();

    this.handleTableDisconnect = this.handleTableDisconnect.bind(this);
    this.handleTableReconnect = this.handleTableReconnect.bind(this);
    this.handleTableUpdate = this.handleTableUpdate.bind(this);
    this.handleTotalsUpdate = this.handleTotalsUpdate.bind(this);
    this.handleRequestFailed = this.handleRequestFailed.bind(this);
    this.handleCustomColumnsChanged = this.handleCustomColumnsChanged.bind(
      this
    );
    this.setViewport = throttle(
      this.setViewport.bind(this),
      SET_VIEWPORT_THROTTLE
    );
    this.applyViewport = throttle(
      this.applyViewport.bind(this),
      APPLY_VIEWPORT_THROTTLE,
      { leading: false }
    );

    this.irisFormatter = formatter;
    this.inputTable = inputTable;
    this.listenerCount = 0;
    this.subscription = null;
    this.table = table;
    this.viewport = null;
    this.viewportData = null;
    this.formattedStringData = [];
    this.pendingStringData = [];

    this.totalsTable = null;
    this.totalsTablePromise = null;
    this.totals = null;
    this.totalsDataMap = null;
  }

  close() {
    this.table.close();
    if (this.totalsTable !== null) {
      this.totalsTable.close();
    }
    if (this.totalsTablePromise !== null) {
      this.totalsTablePromise.cancel();
    }
  }

  startListening() {
    super.startListening();

    this.table.addEventListener(
      dh.Table.EVENT_DISCONNECT,
      this.handleTableDisconnect
    );
    this.table.addEventListener(
      dh.Table.EVENT_RECONNECT,
      this.handleTableReconnect
    );
    this.table.addEventListener(dh.Table.EVENT_UPDATED, this.handleTableUpdate);
    this.table.addEventListener(
      dh.Client.EVENT_REQUEST_FAILED,
      this.handleRequestFailed
    );
    this.table.addEventListener(
      dh.Table.EVENT_CUSTOMCOLUMNSCHANGED,
      this.handleCustomColumnsChanged
    );

    if (this.totalsTable != null) {
      this.addTotalsListeners(this.totalsTable);
    }

    this.applyViewport();
  }

  stopListening() {
    super.stopListening();

    this.table.removeEventListener(
      dh.Table.EVENT_DISCONNECT,
      this.handleTableDisconnect
    );
    this.table.removeEventListener(
      dh.Table.EVENT_RECONNECT,
      this.handleTableReconnect
    );
    this.table.removeEventListener(
      dh.Table.EVENT_UPDATED,
      this.handleTableUpdate
    );
    this.table.removeEventListener(
      dh.Client.EVENT_REQUEST_FAILED,
      this.handleRequestFailed
    );
    this.table.removeEventListener(
      dh.Table.EVENT_CUSTOMCOLUMNSCHANGED,
      this.handleCustomColumnsChanged
    );

    if (this.totalsTable != null) {
      this.removeTotalsListeners(this.totalsTable);
    }

    this.closeSubscription();
  }

  addTotalsListeners(totalsTable) {
    totalsTable.addEventListener(
      dh.Table.EVENT_UPDATED,
      this.handleTotalsUpdate
    );

    // Totals table only has one row of data
    totalsTable.setViewport(0, 0);
  }

  removeTotalsListeners(totalsTable) {
    totalsTable.removeEventListener(
      dh.Table.EVENT_UPDATED,
      this.handleTotalsUpdate
    );
  }

  handleTableDisconnect() {
    this.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.DISCONNECT));
  }

  handleTableReconnect() {
    this.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.RECONNECT));
  }

  handleTableUpdate(event) {
    this.copyViewportData(event.detail);

    this.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  handleTotalsUpdate(event) {
    this.copyTotalsData(event.detail);

    this.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  handleRequestFailed(event) {
    this.dispatchEvent(
      new CustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, event)
    );
  }

  handleCustomColumnsChanged() {
    this.dispatchEvent(
      new CustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: this.columns,
      })
    );
  }

  get rowCount() {
    return this.table.size + (this.totals?.operationOrder?.length ?? 0);
  }

  get columnCount() {
    return this.table.columns.length;
  }

  get floatingBottomRowCount() {
    return this.totals?.showOnTop
      ? 0
      : this.totals?.operationOrder?.length ?? 0;
  }

  get floatingTopRowCount() {
    return this.totals?.showOnTop
      ? this.totals?.operationOrder?.length ?? 0
      : 0;
  }

  get isExportAvailable() {
    return this.table.freeze != null;
  }

  get isColumnStatisticsAvailable() {
    return this.table.getColumnStatistics != null;
  }

  get isValuesTableAvailable() {
    return this.table.selectDistinct != null && this.table.copy != null;
  }

  get isRollupAvailable() {
    return this.table.rollup != null;
  }

  get isSelectDistinctAvailable() {
    return this.table.selectDistinct != null;
  }

  get isCustomColumnsAvailable() {
    return this.table.applyCustomColumns != null;
  }

  get isChartBuilderAvailable() {
    return true;
  }

  get isTotalsAvailable() {
    return true;
  }

  get isEditable() {
    return this.inputTable != null;
  }

  cacheFormattedValue(x, y, text) {
    if (this.formattedStringData[x] == null) {
      this.formattedStringData[x] = [];
    }
    this.formattedStringData[x][y] = text;
  }

  cachePendingValue(x, y, text) {
    if (this.pendingStringData[x] == null) {
      this.pendingStringData[x] = [];
    }
    this.pendingStringData[x][y] = text;
  }

  clearPendingValue(x, y) {
    const column = this.pendingStringData[x];
    if (column != null) {
      delete column[y];
    }
  }

  textForCell(x, y) {
    // First check if there's any pending values we should read from
    if (this.pendingStringData[x]?.[y] !== undefined) {
      return this.pendingStringData[x][y];
    }

    // Use a separate cache from memoization just for the strings that are currently displayed
    if (this.formattedStringData[x]?.[y] === undefined) {
      const value = this.valueForCell(x, y);
      if (value == null) {
        return null;
      }

      const column = this.columns[x];
      const hasCustomColumnFormat = this.getCachedCustomColumnFormatFlag(
        this.formatter,
        column.type,
        column.name
      );
      let formatOverride = null;
      if (!hasCustomColumnFormat) {
        const formatForCell = this.formatForCell(x, y);
        if (formatForCell?.formatString != null) {
          formatOverride = formatForCell;
        }
      }
      const text = this.displayString(
        value,
        column.type,
        column.name,
        formatOverride
      );
      this.cacheFormattedValue(x, y, text);
    }

    return this.formattedStringData[x][y];
  }

  colorForCell(x, y, theme) {
    const data = this.dataForCell(x, y);
    if (data) {
      const { format } = data;
      if (format && format.color) {
        return format.color;
      }

      // Fallback to formatting based on the value/type of the cell
      const { value } = data;
      if (value != null) {
        const column = this.columns[x];
        if (TableUtils.isDateType(column.type) || column.name === 'Date') {
          return theme.dateColor;
        }
        if (TableUtils.isNumberType(column.type)) {
          if (value > 0) {
            return theme.positiveNumberColor;
          }
          if (value < 0) {
            return theme.negativeNumberColor;
          }
          return theme.zeroNumberColor;
        }
      }
    }

    return theme.textColor;
  }

  backgroundColorForCell(x, y) {
    return this.formatForCell(x, y)?.backgroundColor;
  }

  textAlignForCell(x) {
    const column = this.columns[x];
    const { type } = column;

    if (TableUtils.isNumberType(type)) {
      return 'right';
    }
    if (TableUtils.isDateType(type) || column.name === 'Date') {
      return 'center';
    }
    return 'left';
  }

  textForColumnHeader(x) {
    const column = this.columns[x];
    return `${column.name}`;
  }

  textForRowFooter(y) {
    const totalsRow = this.totalsRow(y);
    if (totalsRow != null) {
      return this.totals.operationOrder[totalsRow];
    }
    return '';
  }

  get columns() {
    return this.table.columns;
  }

  get groupedColumns() {
    return [];
  }

  get description() {
    return this.table.description;
  }

  row(y) {
    const totalsRowCount = this.totals?.operationOrder?.length ?? 0;
    const showOnTop = this.totals?.showOnTop ?? false;
    const totalsRow = this.totalsRow(y);
    if (totalsRow != null) {
      const operation = this.totals.operationOrder[totalsRow];
      return this.totalsDataMap?.get(operation) ?? null;
    }
    const offset = this.viewportData?.offset ?? 0;
    const viewportY = (showOnTop ? y - totalsRowCount : y) - offset;
    return this.viewportData?.rows?.[viewportY] ?? null;
  }

  /**
   * Translate from the row in the model to a row in the totals table.
   * If the row is not a totals row, return null
   * @param {number} y The row in the model to get the totals row for
   * @returns {number|null} The row within the totals table if it's a totals row, null otherwise
   */
  totalsRow(y) {
    const totalsRowCount = this.totals?.operationOrder?.length ?? 0;
    const showOnTop = this.totals?.showOnTop ?? false;
    const totalsRow = showOnTop ? y : y - this.table.size;
    if (totalsRow >= 0 && totalsRow < totalsRowCount) {
      return totalsRow;
    }
    return null;
  }

  /**
   * Check if a row is a totals table row
   * @param {number} y The row in the model to check if it's a totals table row
   * @returns {boolean} True if the row is a totals row, false if not
   */
  isTotalsRow(y) {
    return this.totalsRow(y) != null;
  }

  dataForCell(x, y) {
    return this.row(y)?.data.get(x);
  }

  formatForCell(x, y) {
    return this.dataForCell(x, y)?.format;
  }

  valueForCell(x, y) {
    return this.dataForCell(x, y)?.value;
  }

  copyViewportData(data) {
    if (!data) {
      log.warn('invalid data!');
      return;
    }

    this.viewportData = this.extractViewportData(data);
    this.formattedStringData = [];
  }

  copyTotalsData(totalsData) {
    if (!totalsData) {
      log.warn('invalid data!');
      return;
    }

    const { columns, rows } = totalsData;
    if (rows.length !== 1) {
      log.error(
        'Unexpected number of rows received for totals table, ignoring update'
      );
      return;
    }

    const dataMap = new Map();
    const row = rows[0];
    const defaultOperation =
      this.totals?.defaultOperation ?? AggregationOperation.SUM;
    const operationMap = this.totals?.operationMap;
    for (let c = 0; c < columns.length; c += 1) {
      const column = columns[c];
      const [
        name,
        operation = operationMap?.[name]?.[0] ?? defaultOperation,
      ] = column.name.split('__');
      if (!dataMap.has(operation)) {
        dataMap.set(operation, { data: new Map() });
      }
      const { data: rowData } = dataMap.get(operation);
      const columnIndex = this.table.columns.findIndex(
        col => col.name === name
      );
      rowData.set(columnIndex, {
        value: row.get(column),
        format: row.getFormat(column),
      });
    }

    log.debug2('copyTotalsData', dataMap);

    this.totalsDataMap = dataMap;
  }

  /**
   * Copies all the viewport data into an object that we can reference later.
   * @param {ViewportData} data The data to copy from
   */
  extractViewportData(data) {
    const newData = {
      offset: data.offset,
      rows: [],
    };

    const { columns } = data;
    for (let r = 0; r < data.rows.length; r += 1) {
      const row = data.rows[r];
      const newRow = this.extractViewportRow(row, columns);
      newData.rows.push(newRow);
    }

    return newData;
  }

  extractViewportRow(row, columns) {
    const data = new Map();
    for (let c = 0; c < columns.length; c += 1) {
      const column = columns[c];
      data.set(column.index, {
        value: row.get(column),
        format: row.getFormat(column),
      });
    }

    return { data };
  }

  closeSubscription() {
    log.debug2('closeSubscription', this.subscription);
    if (this.subscription) {
      this.subscription.close();
      this.subscription = null;
    }

    this.setViewport.cancel();
    this.applyViewport.cancel();
  }

  get filter() {
    return this.table.filter;
  }

  set filter(filter) {
    this.closeSubscription();
    this.table.applyFilter(filter);
    this.applyViewport();
  }

  get formatter() {
    return this.irisFormatter;
  }

  set formatter(formatter) {
    this.irisFormatter = formatter;
    this.formattedStringData = [];
    this.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.FORMATTER_UPDATED));
  }

  displayString(value, columnType, columnName = '', formatOverride = null) {
    return this.getCachedFormattedString(
      this.formatter,
      value,
      columnType,
      columnName,
      formatOverride
    );
  }

  get sort() {
    return this.table.sort;
  }

  set sort(sort) {
    this.closeSubscription();
    this.table.applySort(sort);
    this.applyViewport();
  }

  get customColumns() {
    return this.table.customColumns ?? [];
  }

  set customColumns(customColumns) {
    this.closeSubscription();
    this.table.applyCustomColumns(customColumns);
    this.applyViewport();
  }

  set totalsConfig(totalsConfig) {
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
      this.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.UPDATED));
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
          new CustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, { detail: err })
        );
      });
  }

  setTotalsTable(totalsTable) {
    log.debug('setTotalsTable', totalsTable);

    if (this.totalsTable !== null) {
      if (this.listenerCount > 0) {
        this.removeTotalsListeners(this.totalsTable);
      }

      this.totalsTable.close();
    }

    this.totalsTable = totalsTable;

    if (this.listenerCount > 0 && this.totalsTable != null) {
      this.addTotalsListeners(totalsTable);
    }
  }

  setViewport(top, bottom, columns) {
    if (bottom < top) {
      log.error('Invalid viewport', top, bottom);
      return;
    }

    const { viewport } = this;
    if (
      viewport != null &&
      viewport.top === top &&
      viewport.bottom === bottom &&
      viewport.columns === columns
    ) {
      log.debug2('Ignoring duplicate viewport', viewport);
      return;
    }

    this.viewport = {
      top,
      bottom,
      columns,
    };
    log.debug2('setViewport', this.viewport);

    this.applyViewport();
  }

  /**
   * Applies the current viewport to the underlying table.
   */
  applyViewport() {
    if (!this.viewport) {
      return;
    }

    log.debug2('applyViewport', this.viewport);
    const { top, bottom, columns } = this.viewport;
    const [viewportTop, viewportBottom] = this.getCachedViewportRowRange(
      top,
      bottom
    );
    this.applyBufferedViewport(viewportTop, viewportBottom, columns);
  }

  applyBufferedViewport(viewportTop, viewportBottom, columns) {
    log.debug2('applyBufferedViewport', columns);
    if (this.subscription == null) {
      log.debug2('applyBufferedViewport creating new subscription');
      this.subscription = this.table.setViewport(
        viewportTop,
        viewportBottom,
        columns
      );
    } else {
      log.debug2('applyBufferedViewport using existing subscription');
      this.subscription.setViewport(viewportTop, viewportBottom, columns);
    }
  }

  async snapshot(ranges, includeHeaders = false, formatValue = value => value) {
    if (this.subscription == null) {
      throw new Error('No subscription available');
    }

    const consolidated = GridRange.consolidate(ranges);
    if (!IrisGridUtils.isValidSnapshotRanges(consolidated)) {
      throw new Error('Invalid snapshot ranges', ranges);
    }

    // Need to separate out the floating ranges as they're from a different source
    const topFloatingRowsSet = new Set();
    const tableRanges = [];
    const bottomFloatingRowsSet = new Set();
    for (let i = 0; i < consolidated.length; i += 1) {
      const range = consolidated[i];

      // Get the rows that are in the top aggregations section
      for (
        let r = range.startRow;
        r <= range.endRow && r < this.floatingTopRowCount;
        r += 1
      ) {
        topFloatingRowsSet.add(r);
      }

      // Separate out the range that is part of the actual table (ie. not the floating ranges, not aggregations)
      if (
        range.endRow >= this.floatingTopRowCount &&
        range.startRow <= this.floatingTopRowCount + this.table.size
      ) {
        tableRanges.push(
          new GridRange(
            range.startColumn,
            Math.min(Math.max(0, range.startRow - this.floatingTopRowCount)),
            range.endColumn,
            Math.min(
              Math.max(0, range.endRow - this.floatingTopRowCount),
              this.table.size - this.floatingTopRowCount
            )
          )
        );
      }

      // Get the rows that are in the bottom aggregations section
      for (
        let r = Math.max(
          range.startRow,
          this.floatingTopRowCount + this.table.size
        );
        r <= range.endRow &&
        r <
          this.floatingTopRowCount +
            this.table.size +
            this.floatingBottomRowCount;
        r += 1
      ) {
        bottomFloatingRowsSet.add(r);
      }
    }

    const columns = IrisGridUtils.columnsFromRanges(consolidated, this.columns);
    const result = [];
    if (includeHeaders) {
      result.push(columns.map(c => c.name));
    }
    const topFloatingRows = [...topFloatingRowsSet].sort();
    for (let i = 0; i < topFloatingRows.length; i += 1) {
      const row = topFloatingRows[i];
      const rowData = columns.map(column =>
        formatValue(this.valueForCell(column.index, row), column)
      );
      if (includeHeaders) {
        rowData.push(this.textForRowFooter(row));
      }
      result.push(rowData);
    }

    if (tableRanges.length > 0) {
      const rangeSet = IrisGridUtils.rangeSetFromRanges(tableRanges);
      const snapshot = await this.subscription.snapshot(rangeSet, columns);
      result.push(
        ...snapshot.rows.map(rowData =>
          columns.map(column => formatValue(rowData.get(column), column))
        )
      );
    }

    const bottomFloatingRows = [...bottomFloatingRowsSet].sort();
    for (let i = 0; i < bottomFloatingRows.length; i += 1) {
      const row = bottomFloatingRows[i];
      const rowData = columns.map(column =>
        formatValue(this.valueForCell(column.index, row), column)
      );
      if (includeHeaders) {
        rowData.push(this.textForRowFooter(row));
      }
      result.push(rowData);
    }

    return result;
  }

  /**
   * Get a text snapshot of the provided ranges
   * @param {GridRange[]} ranges The ranges to get the snapshot for
   * @param {boolean} includeHeaders Whether to include the headers in the snapshot or not
   * @param {(unknown, dh.Column) => string} formatValue Function for formatting the raw value into a string
   * @returns {string} A formatted string of all the data, columns separated by `\t` and rows separated by `\n`
   */
  async textSnapshot(
    ranges,
    includeHeaders = false,
    formatValue = value => `${value}`
  ) {
    log.debug2('textSnapshot', ranges, includeHeaders);

    const data = await this.snapshot(ranges, includeHeaders, formatValue);
    return data.map(row => row.join('\t')).join('\n');
  }

  get isFilterRequired() {
    return this.table.isUncoalesced;
  }

  get hasExpandableRows() {
    return false;
  }

  isFilterable(columnIndex) {
    return this.getCachedFilterableColumnSet(this.columns).has(columnIndex);
  }

  isRowExpanded(y) {
    const row = this.row(y);
    return row?.isExpanded ?? false;
  }

  setRowExpanded(y, isExpanded) {
    this.table.setExpanded(y, isExpanded);
  }

  depthForRow(y) {
    const row = this.row(y);
    return (row?.depth ?? 1) - 1;
  }

  async valuesTable(column) {
    let table = null;
    try {
      table = await this.table.copy();
      table.applyFilter([]);
      table.applySort([]);
      return table.selectDistinct([column]);
    } finally {
      if (table != null) {
        table.close();
      }
    }
  }

  async export() {
    return this.table.freeze();
  }

  columnStatistics(column) {
    return this.table.getColumnStatistics(column);
  }

  getCachedFilterableColumnSet = memoize(
    columns => new Set(columns.map((_, index) => index))
  );

  getCachedFormattedString = memoizeClear(
    (formatter, value, columnType, columnName, formatOverride) =>
      formatter.getFormattedString(
        value,
        columnType,
        columnName,
        formatOverride
      ),
    { max: 10000 }
  );

  getCachedCustomColumnFormatFlag = memoizeClear(
    (formatter, columnType, columnName) => {
      const columnFormat = formatter.getColumnFormat(columnType, columnName);
      return (
        columnFormat != null &&
        (columnFormat.type === TableColumnFormatter.TYPE_CONTEXT_PRESET ||
          columnFormat.type === TableColumnFormatter.TYPE_CONTEXT_CUSTOM)
      );
    },
    { max: 10000 }
  );

  getCachedViewportRowRange = memoize((top, bottom) => {
    const viewHeight = bottom - top;
    const viewportTop = Math.max(
      0,
      top - viewHeight * IrisGridTableModel.ROW_BUFFER_PAGES
    );
    const viewportBottom =
      bottom + viewHeight * IrisGridTableModel.ROW_BUFFER_PAGES;
    return [viewportTop, viewportBottom];
  });

  isColumnMovable(column) {
    return column >= (this.inputTable?.keyColumns.length ?? 0);
  }

  isRowMovable() {
    return false;
  }

  isEditableRange(range) {
    return (
      this.inputTable != null &&
      GridRange.isBounded(range) &&
      range.startColumn >= this.inputTable.keyColumns.length &&
      range.endColumn >= this.inputTable.keyColumns.length &&
      range.startRow >= this.floatingTopRowCount &&
      range.startRow < this.floatingTopRowCount + this.table.size &&
      range.endRow < this.floatingTopRowCount + this.table.size
    );
  }

  isEditableRanges(ranges) {
    return ranges.every(range => this.isEditableRange(range));
  }

  /**
   * Set value in an editable table
   * @param {number} x The column to set
   * @param {number} y The row to set
   * @param {string} value The value to set
   * @returns {Promise<void>} A promise that resolves successfully when the operation is complete, or rejects if there's an error
   */
  async setValueForCell(x, y, text) {
    // Cache the value in our pending string cache so that it stays displayed until our edit has been completed
    return this.setValueForRanges([new GridRange(x, y, x, y)], text);
  }

  /**
   * Set value in an editable table
   * @param {GridRange[]} ranges The ranges to set
   * @param {string} value The value to set
   * @returns {Promise<void>} A promise that resolves successfully when the operation is complete, or rejects if there's an error
   */
  async setValueForRanges(ranges, text) {
    if (!this.isEditableRanges(ranges)) {
      throw new Error('Uneditable ranges', ranges);
    }

    try {
      // Cache the value in our pending string cache so that it stays displayed until our edit has been completed
      const columnSet = new Set();

      // Formatted text for each column
      // Since there could be different formatting for each column, but the value will be the same across rows
      const formattedText = [];
      GridRange.forEachCell(ranges, (x, y) => {
        const column = this.columns[x];
        columnSet.add(column);
        if (formattedText[x] === undefined) {
          const value = TableUtils.makeValue(column.type, text);
          formattedText[x] = this.displayString(
            value,
            column.type,
            column.name
          );
        }
        this.cachePendingValue(x, y, formattedText[x]);
      });

      this.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.UPDATED));

      // Get a snapshot of the full rows, as we need to write a full row when editing
      const data = await this.snapshot(
        ranges.map(
          range => new GridRange(null, range.startRow, null, range.endRow)
        )
      );
      const newRows = data.map(row => {
        const newRow = {};
        for (let c = 0; c < this.columns.length; c += 1) {
          newRow[this.columns[c].name] = row[c];
        }

        columnSet.forEach(column => {
          newRow[column.name] = TableUtils.makeValue(column.type, text);
        });
        return newRow;
      });

      const result = await this.inputTable.addRows(newRows);

      log.debug('setValueForRanges(', ranges, ',', text, ') result', result);

      // Add it to the formatted cache so it's still displayed until the update event is received
      // The update event could be received on the next tick, after the input rows have been committed,
      // so make sure we don't display stale data
      GridRange.forEachCell(ranges, (x, y) => {
        this.cacheFormattedValue(x, y, formattedText[x]);
      });
    } catch (err) {
      log.error('Unable to set ranges', ranges, text, err);
    } finally {
      GridRange.forEachCell(ranges, (x, y) => {
        this.clearPendingValue(x, y);
      });
    }
  }

  editValueForCell(x, y) {
    return this.textForCell(x, y);
  }

  async delete(ranges) {
    if (!this.isEditableRanges(ranges)) {
      throw new Error('Uneditable ranges', ranges);
    }

    const { keyColumns } = this.inputTable;
    if (keyColumns.length === 0) {
      throw new Error('No key columns to allow deletion');
    }

    const [data, deleteTable] = await Promise.all([
      // Need to get the key values of each row
      this.snapshot(
        ranges.map(
          range =>
            new GridRange(
              0,
              range.startRow,
              keyColumns.length - 1,
              range.endRow
            )
        )
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

    const result = await this.inputTable.deleteTable(deleteTable);
    deleteTable.close();
    return result;
  }

  isValidForCell(x, y, value) {
    try {
      const column = this.columns[x];
      TableUtils.makeValue(column.type, value);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default IrisGridTableModel;
