/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import { GridModel } from '@deephaven/grid';
import dh from '@deephaven/jsapi-shim';
import Formatter from './Formatter';

/**
 * Abstract class that extends the GridModel to have more functionality, like filtering and sorting.
 * For use from IrisGrid.
 * Provides some abstraction from the dh.Table and dh.TreeTable classes, so we can treat them somewhat the same.
 * Note that it still uses dh.Column, dh.FilterCondition, dh.Sort, etc., still. Theoretically should abstract
 * those out as well, so there's no dependency on IrisAPI at all, but it's a lot of work for no real gain at this time.
 */
class IrisGridModel extends GridModel {
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
  });

  constructor() {
    super();

    this.listenerCount = 0;
  }

  addEventListener(...args) {
    super.addEventListener(...args);

    this.listenerCount += 1;
    if (this.listenerCount === 1) {
      this.startListening();
    }
  }

  removeEventListener(...args) {
    super.removeEventListener(...args);

    this.listenerCount -= 1;
    if (this.listenerCount === 0) {
      this.stopListening();
    }
  }

  /**
   * Function called when first listener is added.
   * Override for implementation specific behaviour.
   */
  startListening() {}

  /**
   * Function called when last listener is removed.
   * Override for implementation specific behaviour.
   */
  stopListening() {}

  /**
   * Gets the columns for this model
   * @returns {dh.Column[]} All columns in the model
   */
  get columns() {
    throw new Error('get columns not implemented');
  }

  /**
   * Gets the columns for the model before any transformations (such as rollups) are applied.
   * @returns {dh.Column[]} All original columns in the model.
   */
  get originalColumns() {
    return this.columns;
  }

  /**
   * Retrieve the grouped columns for this model
   * @returns {dh.Column[]} The columns that are grouped
   */
  get groupedColumns() {
    throw new Error('get groupedColumns not implemented');
  }

  /**
   * The description for this model.
   * @returns {String} The description of the model
   */
  get description() {
    throw new Error('get description not implemented');
  }

  /**
   * @param {Number} x The model column index
   * @param {Number} y The model row index
   * @returns {dh.Format} The format stored for that cell
   */
  formatForCell(x, y) {
    throw new Error('formatForCell not implemented');
  }

  /**
   * @param {Number} x The model column index
   * @param {Number} y The model row index
   * @returns {Any} The value stored for that cell
   */
  valueForCell(x, y) {
    throw new Error('valueForCell not implemented');
  }

  /**
   * @returns {FilterCondition[]} The filters set on this model
   */
  get filter() {
    throw new Error('get filter not implemented');
  }

  /**
   * @param {FilterCondition[]} filter The filters to set
   */
  set filter(filter) {
    throw new Error('set filter not implemented');
  }

  /**
   * @returns {Formatter} The formatter used when formatting data
   */
  get formatter() {
    throw new Error('get formatter not implemented');
  }

  /**
   * @param {Formatter} formatter The formatter to set
   */
  set formatter(formatter) {
    throw new Error('set formatter not implemented');
  }

  /**
   * @param {Any} value The value to format
   * @param {String} columnType The column type to format
   * @param {String} columnName The column name to format
   */
  displayString(value, columnType, columnName = '') {
    throw new Error('displayString not implemented');
  }

  /**
   * @returns {dh.Sort[]} The sorts used on this model
   */
  get sort() {
    throw new Error('get sort not implemented');
  }

  /**
   * @param {dh.Sort[]} sort The sorts to use on this model
   */
  set sort(sort) {
    throw new Error('set sort not implemented');
  }

  /**
   * @returns {String[]} The custom columns on this model
   */
  get customColumns() {
    throw new Error('get customColumns not implemented');
  }

  /**
   * @param {String[]} customColumns The custom columns to use
   */
  set customColumns(customColumns) {
    throw new Error('set customColumns not implemented');
  }

  /**
   * @returns {dh.RollupTableConfig} The config to use for rolling up this table
   */
  get rollupConfig() {
    throw new Error('get rollupConfig not implemented');
  }

  set rollupConfig(rollupConfig) {
    throw new Error('set rollupConfig not implemented');
  }

  /**
   * @returns {dh.TotalsTableConfig} The config to use for the totals table of this model
   */
  get totalsConfig() {
    throw new Error('get totalsConfig not implemented');
  }

  set totalsConfig(totalsConfig) {
    throw new Error('set totalsConfig not implemented');
  }

  /**
   * @returns {dh.LayoutHints} The LayoutHints to use for the columns of this table model
   */
  get layoutHints() {
    throw new Error('get layoutHints not implemented');
  }

  /**
   * @returns {boolean} True if this model requires a filter to be set
   */
  get isFilterRequired() {
    return false;
  }

  get isReversible() {
    return true;
  }

  /**
   * @returns {boolean} True if this model supports the columnStatistics(column) function
   */
  get isColumnStatisticsAvailable() {
    return false;
  }

  /**
   * @returns {boolean} True if this model supports customColumns
   */
  get isCustomColumnsAvailable() {
    return false;
  }

  /**
   * @returns {boolean} True if this model supports the export() function
   */
  get isExportAvailable() {
    return false;
  }

  /**
   * @returns {boolean} True if this model supports the valuesTable(column) function
   */
  get isValuesTableAvailable() {
    return false;
  }

  /**
   * @returns {boolean} True if this model should allow the chart builder
   */
  get isChartBuilderAvailable() {
    return false;
  }

  /**
   * @returns {boolean} True if the rollup rows functionality is available
   */
  get isRollupAvailable() {
    return false;
  }

  /**
   * @returns {boolean} True if the totals functionality is available
   */
  get isTotalsAvailable() {
    return false;
  }

  /**
   * The pending data for this model
   * @returns {Map<number, Map<string, value>>} A map of row index to a map of column name/value pairs
   */
  get pendingDataMap() {
    throw new Error('get pendingDataMap not implemented');
  }

  /**
   * Set the pending data for this model
   * @param {Map<number, Map<string, value>>} A map of row index to a map of column name/value pairs
   */
  set pendingDataMap(map) {
    throw new Error('set pendingDataMap not implemented');
  }

  /**
   * @returns {number} The count of pending rows to show
   */
  get pendingRowCount() {
    throw new Error('get pendingRowCount not implemented');
  }

  /**
   * Set the count of pending rows to show
   * @param {number} count The count of pending rows to show
   */
  set pendingRowCount(count) {
    throw new Error('set pendingRowCount not implemented');
  }

  /**
   * Errors for the pending data
   * @returns {Map<number, Error>} Map from row number to the error
   */
  get pendingDataErrors() {
    throw new Error('get pendingDataErrors not implemented');
  }

  /**
   * Commit pending data and save all data to the table
   */
  async commitPending() {
    throw new Error('commitPending not implemented');
  }

  /**
   * Check if a column is filterable
   * @param columnIndex {number} The column index to check for filterability
   * @returns {boolean} True if the current provided column index is filterable, false otherwise
   */
  isFilterable(columnIndex) {
    return false;
  }

  /**
   * Set the indices of the viewport
   * @param {number} top Top of viewport
   * @param {number} bottom Bottom of viewport
   * @param {Iris.Column[]} columns The columns in the viewport. `null` for all columns
   */
  setViewport(top, bottom, columns) {
    throw new Error('setViewport not implemented');
  }

  /**
   * Takes a snapshot of the provided ranges
   * @param {GridRange[]} ranges The model ranges to take the snapshot of
   * @returns {unknown[][]} Returns the data in a row/column matrix
   */
  async snapshot(ranges) {
    throw new Error('snapshot not implemented');
  }

  /**
   * @param {GridRange[]} ranges The ranges to take a snapshot of
   * @param {boolean} includeHeaders Whether to include the headers in the snapshot or not
   * @param {(unknown, dh.Column, dh.Row) => string} formatValue A function to format a value for a cell. Defaults to model format value.
   * @returns {Promise<string>} A text formatted snapshot of the data for the specified range set
   */
  async textSnapshot(ranges, includeHeaders, formatValue) {
    throw new Error('textSnapshot not implemented');
  }

  /**
   * @returns {Promise<dh.Table>} Returns a raw table that is frozen and can be used for exporting data
   */
  async export() {
    throw new Error('export not implemented');
  }

  /**
   * @param {dh.Column} column The column to get the distinct values for
   * @returns {Promise<dh.Table>} A table partitioned on the column specified
   */
  async valuesTable(column) {
    throw new Error('getValuesTable not implemented');
  }

  /**
   * @param {dh.Column} column The column to get statistics for
   * @returns {Promise<dh.ColumnStatistics>} The column statistics
   */
  async columnStatistics(column) {
    throw new Error('columnStatistics not implemented');
  }

  /**
   * Close this model. It can no longer be used after being closed
   */
  close() {}

  /**
   * Don't allow any rows to be movable in any IrisGrids by default. Just columns.
   */
  isRowMovable() {
    return false;
  }
}

export default IrisGridModel;
