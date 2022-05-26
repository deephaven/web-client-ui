/* eslint class-methods-use-this: "off" */
import deepEqual from 'deep-equal';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { CancelablePromise, PromiseUtils } from '@deephaven/utils';
import IrisGridTableModel from './IrisGridTableModel';
import IrisGridTreeTableModel from './IrisGridTreeTableModel';
import IrisGridModel from './IrisGridModel';
import { Table } from '@deephaven/jsapi-shim';

const log = Log.module('IrisGridProxyModel');

function makeModel(table: Table, formatter?: Formatter, inputTable?: null) {
  if (TableUtils.isTreeTable(table)) {
    return new IrisGridTreeTableModel(table, formatter);
  }
  return new IrisGridTableModel(table, formatter, inputTable);
}

/**
 * Model which proxies calls to other IrisGridModels.
 * This allows for operations that generate new tables, like rollups.
 */
class IrisGridProxyModel extends IrisGridModel {
  /**
   * @param {dh.Table} table Iris data table to be used in the model
   * @param {Formatter} formatter The formatter to use when getting formats
   * @param {dh.InputTable} inputTable Iris input table associated with this table
   */

  originalModel: IrisGridTreeTableModel | IrisGridTableModel;
  model: IrisGridTreeTableModel | IrisGridTableModel;
  modelPromise: CancelablePromise<
    IrisGridTreeTableModel | IrisGridTableModel
  > | null;
  rollup: null;
  selectDistinct: [];
  constructor(table: Table, formatter = new Formatter(), inputTable = null) {
    super();

    this.handleModelEvent = this.handleModelEvent.bind(this);

    const model = makeModel(table, formatter, inputTable);
    this.originalModel = model;
    this.model = model;
    this.modelPromise = null;
    this.rollup = null;
    this.selectDistinct = [];
  }

  close() {
    this.originalModel.close();
    if (this.model !== this.originalModel) {
      this.model.close();
    }
    if (this.modelPromise != null) {
      this.modelPromise.cancel();
    }
  }

  handleModelEvent(event) {
    log.debug2('handleModelEvent', event);

    const { detail, type } = event;
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  setModel(model: IrisGridTreeTableModel | IrisGridTableModel): void {
    log.debug('setModel', model);

    const oldModel = this.model;

    if (oldModel !== this.originalModel) {
      oldModel.close();
    }

    this.model = model;

    if (this.listenerCount > 0) {
      this.addListeners(model);
    }

    this.dispatchEvent(
      new CustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: model.columns,
      })
    );

    this.dispatchEvent(
      new CustomEvent(IrisGridModel.EVENT.TABLE_CHANGED, {
        detail: model.table,
      })
    );
  }

  setNextModel(
    modelPromise:
      | IrisGridTreeTableModel
      | IrisGridTableModel
      | Promise<IrisGridTreeTableModel | IrisGridTableModel>
  ) {
    log.debug2('setNextModel');

    if (this.modelPromise) {
      this.modelPromise.cancel();
    }

    if (this.listenerCount > 0) {
      this.removeListeners(this.model);
    }

    this.modelPromise = PromiseUtils.makeCancelable(
      modelPromise,
      (model: IrisGridTreeTableModel | IrisGridTableModel) => model.close()
    );
    this.modelPromise
      .then(model => {
        this.modelPromise = null;
        this.setModel(model);
      })
      .catch((err: unknown) => {
        if (PromiseUtils.isCanceled(err)) {
          log.debug2('setNextModel cancelled');
          return;
        }

        log.error('Unable to set next model', err);
        this.modelPromise = null;

        this.dispatchEvent(
          new CustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, { detail: err })
        );
      });
  }

  startListening(): void {
    super.startListening();

    this.addListeners(this.model);
  }

  stopListening(): void {
    super.stopListening();

    this.removeListeners(this.model);
  }

  addListeners(model: IrisGridTreeTableModel | IrisGridTableModel) {
    const events = Object.keys(IrisGridModel.EVENT);
    for (let i = 0; i < events.length; i += 1) {
      model.addEventListener(events[i], this.handleModelEvent);
    }
  }

  removeListeners(model: IrisGridTreeTableModel | IrisGridTableModel) {
    const events = Object.keys(IrisGridModel.EVENT);
    for (let i = 0; i < events.length; i += 1) {
      model.removeEventListener(events[i], this.handleModelEvent);
    }
  }

  get rowCount() {
    return this.model.rowCount;
  }

  get columnCount() {
    return this.model.columnCount;
  }

  get floatingTopRowCount() {
    return this.model.floatingTopRowCount;
  }

  get floatingBottomRowCount() {
    return this.model.floatingBottomRowCount;
  }

  get floatingLeftColumnCount() {
    return this.model.floatingLeftColumnCount;
  }

  get floatingRightColumnCount() {
    return this.model.floatingRightColumnCount;
  }

  textForCell(...args) {
    return this.model.textForCell(...args);
  }

  truncationCharForCell(...args) {
    return this.model.truncationCharForCell(...args);
  }

  textAlignForCell(...args) {
    return this.model.textAlignForCell(...args);
  }

  colorForCell(...args) {
    return this.model.colorForCell(...args);
  }

  backgroundColorForCell(...args) {
    return this.model.backgroundColorForCell(...args);
  }

  textForColumnHeader(...args) {
    return this.model.textForColumnHeader(...args);
  }

  textForRowHeader(...args) {
    return this.model.textForRowHeader(...args);
  }

  textForRowFooter(...args) {
    return this.model.textForRowFooter(...args);
  }

  isRowMovable(...args) {
    return this.model.isRowMovable(...args);
  }

  isColumnMovable(...args) {
    return this.model.isColumnMovable(...args);
  }

  isColumnFrozen(...args) {
    return this.model.isColumnFrozen(...args);
  }

  get hasExpandableRows() {
    return this.model.hasExpandableRows;
  }

  isRowExpandable(...args) {
    return this.model.isRowExpandable(...args);
  }

  isRowExpanded(...args) {
    return this.model.isRowExpanded(...args);
  }

  setRowExpanded(...args) {
    this.model.setRowExpanded(...args);
  }

  depthForRow(...args) {
    return this.model.depthForRow(...args);
  }

  get table() {
    return this.model.table;
  }

  get isExportAvailable() {
    return this.model.isExportAvailable;
  }

  get isColumnStatisticsAvailable() {
    return this.model.isColumnStatisticsAvailable;
  }

  get isValuesTableAvailable() {
    return this.model.isValuesTableAvailable;
  }

  get isCustomColumnsAvailable() {
    return (
      this.model.isCustomColumnsAvailable &&
      // Disable for selectDistinct tables
      !(this.isSelectDistinctAvailable && this.selectDistinctColumns.length > 0)
    );
  }

  get isFormatColumnsAvailable() {
    return this.model.isFormatColumnsAvailable;
  }

  get isChartBuilderAvailable() {
    return this.model.isChartBuilderAvailable;
  }

  get isRollupAvailable() {
    return (
      (this.originalModel.isRollupAvailable || this.rollup != null) &&
      this.selectDistinct.length === 0
    );
  }

  get isSelectDistinctAvailable() {
    return (
      (this.originalModel.isSelectDistinctAvailable ||
        this.selectDistinct.length > 0) &&
      this.rollup == null
    );
  }

  get isTotalsAvailable() {
    return this.model.isTotalsAvailable;
  }

  get isReversible() {
    return this.model.isReversible;
  }

  get columns() {
    return this.model.columns;
  }

  get movedColumns() {
    return this.model.movedColumns;
  }

  get movedRows() {
    return this.model.movedRows;
  }

  get layoutHints() {
    return this.model.layoutHints;
  }

  get frontColumns() {
    return this.model.frontColumns;
  }

  get backColumns() {
    return this.model.backColumns;
  }

  get frozenColumns() {
    return this.model.frozenColumns;
  }

  updateFrozenColumns(...args) {
    this.model.updateFrozenColumns(...args);
  }

  get originalColumns() {
    return this.originalModel.columns;
  }

  get groupedColumns() {
    return this.model.groupedColumns;
  }

  get description() {
    return this.model.description;
  }

  formatForCell(x, y) {
    return this.model.formatForCell(x, y);
  }

  valueForCell(x, y) {
    return this.model.valueForCell(x, y);
  }

  get filter() {
    return this.model.filter;
  }

  set filter(filter) {
    this.model.filter = filter;
  }

  get formatter() {
    return this.model.formatter;
  }

  set formatter(formatter) {
    this.model.formatter = formatter;
  }

  displayString(...args) {
    return this.model.displayString(...args);
  }

  get sort() {
    return this.model.sort;
  }

  set sort(sort) {
    this.model.sort = sort;
  }

  get customColumns() {
    return this.model.customColumns;
  }

  set customColumns(customColumns) {
    this.model.customColumns = customColumns;
  }

  get formatColumns() {
    return this.model.formatColumns;
  }

  set formatColumns(formatColumns) {
    this.model.formatColumns = formatColumns;
  }

  get rollupConfig() {
    return this.rollup;
  }

  set rollupConfig(rollupConfig) {
    log.debug('set rollupConfig', rollupConfig);

    if (!this.isRollupAvailable) {
      throw new Error('Rollup Rows are not available');
    }

    // Prevent model update when IrisGridModelUpdater is mounted
    // if rollup is already initialized in IrisGridPanel
    if (deepEqual(rollupConfig, this.rollup)) {
      return;
    }

    this.rollup = rollupConfig;

    let modelPromise = Promise.resolve(this.originalModel);

    if (rollupConfig != null) {
      modelPromise = this.originalModel.table
        .rollup(rollupConfig)
        .then(table => makeModel(table, this.formatter));
    }
    this.setNextModel(modelPromise);
  }

  get selectDistinctColumns() {
    return this.selectDistinct;
  }

  set selectDistinctColumns(columnNames) {
    log.debug('set selectDistinctColumns', columnNames);

    if (!this.isSelectDistinctAvailable) {
      throw new Error('Select distinct is not available');
    }

    if (
      columnNames === this.selectDistinctColumns ||
      (columnNames.length === 0 && this.selectDistinctColumns.length === 0)
    ) {
      log.debug('Ignore same selectDistinctColumns', columnNames);
      return;
    }

    this.selectDistinct = columnNames;

    const selectDistinctColumns = columnNames
      .map(name => this.originalColumns.find(column => column.name === name))
      .filter(column => column != null);

    let modelPromise = Promise.resolve(this.originalModel);

    if (columnNames.length > 0) {
      modelPromise = this.originalModel.table
        .selectDistinct(selectDistinctColumns)
        .then(table => makeModel(table, this.formatter));
    }
    this.setNextModel(modelPromise);
  }

  get totalsConfig() {
    return this.model.totalsConfig;
  }

  set totalsConfig(totalsConfig) {
    this.model.totalsConfig = totalsConfig;
  }

  get isFilterRequired() {
    return this.model.isFilterRequired;
  }

  get isEditable() {
    return this.model.isEditable;
  }

  isEditableRange(...args) {
    return this.model.isEditableRange(...args);
  }

  isFilterable(...args) {
    return this.model.isFilterable(...args);
  }

  setViewport(...args) {
    this.model.setViewport(...args);
  }

  async snapshot(...args) {
    return this.model.snapshot(...args);
  }

  async textSnapshot(...args) {
    return this.model.textSnapshot(...args);
  }

  async export(...args) {
    return this.model.export(...args);
  }

  async valuesTable(...args) {
    return this.model.valuesTable(...args);
  }

  async columnStatistics(...args) {
    return this.model.columnStatistics(...args);
  }

  editValueForCell(...args) {
    return this.model.editValueForCell(...args);
  }

  setValueForCell(...args) {
    return this.model.setValueForCell(...args);
  }

  setValueForRanges(...args) {
    return this.model.setValueForRanges(...args);
  }

  setValues(...args) {
    return this.model.setValues(...args);
  }

  isValidForCell(...args) {
    return this.model.isValidForCell(...args);
  }

  delete(...args) {
    return this.model.delete(...args);
  }

  get pendingDataMap() {
    return this.model.pendingDataMap;
  }

  set pendingDataMap(map) {
    this.model.pendingDataMap = map;
  }

  get pendingRowCount() {
    return this.model.pendingRowCount;
  }

  set pendingRowCount(count) {
    this.model.pendingRowCount = count;
  }

  get pendingDataErrors() {
    return this.model.pendingDataErrors;
  }

  commitPending(...args) {
    return this.model.commitPending(...args);
  }

  getColumnIndexByName(name) {
    return this.model.getColumnIndexByName(name);
  }
}

export default IrisGridProxyModel;
