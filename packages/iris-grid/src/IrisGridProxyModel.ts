/* eslint class-methods-use-this: "off" */
import deepEqual from 'deep-equal';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
  CancelablePromise,
  EventShimCustomEvent,
  PromiseUtils,
} from '@deephaven/utils';
import {
  Column,
  ColumnStatistics,
  CustomColumn,
  FilterCondition,
  InputTable,
  LayoutHints,
  RollupConfig,
  Sort,
  Table,
  TreeTable,
} from '@deephaven/jsapi-shim';
import {
  EditableGridModel,
  isEditableGridModel,
  isExpandableGridModel,
  ModelIndex,
  MoveOperation,
} from '@deephaven/grid';
import IrisGridTableModel from './IrisGridTableModel';
import IrisGridTreeTableModel from './IrisGridTreeTableModel';
import IrisGridModel from './IrisGridModel';
import {
  ColumnName,
  UITotalsTableConfig,
  PendingDataMap,
  UIRow,
  PendingDataErrorMap,
} from './CommonTypes';
import { isIrisGridTableModelTemplate } from './IrisGridTableModelTemplate';

const log = Log.module('IrisGridProxyModel');

function makeModel(
  table: Table | TreeTable,
  formatter?: Formatter,
  inputTable?: InputTable | null
): IrisGridModel {
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
   * @param table Iris data table to be used in the model
   * @param formatter The formatter to use when getting formats
   * @param inputTable Iris input table associated with this table
   */

  originalModel: IrisGridModel;

  model: IrisGridModel;

  modelPromise: CancelablePromise<IrisGridModel> | null;

  rollup: RollupConfig | null;

  selectDistinct: ColumnName[];

  constructor(
    table: Table | TreeTable,
    formatter = new Formatter(),
    inputTable: InputTable | null = null
  ) {
    super();

    this.handleModelEvent = this.handleModelEvent.bind(this);

    const model = makeModel(table, formatter, inputTable);
    this.originalModel = model;
    this.model = model;
    this.modelPromise = null;
    this.rollup = null;
    this.selectDistinct = [];
  }

  close(): void {
    this.originalModel.close();
    if (this.model !== this.originalModel) {
      this.model.close();
    }
    if (this.modelPromise != null) {
      this.modelPromise.cancel();
    }
  }

  handleModelEvent(event: CustomEvent): void {
    log.debug2('handleModelEvent', event);

    const { detail, type } = event;
    this.dispatchEvent(new EventShimCustomEvent(type, { detail }));
  }

  setModel(model: IrisGridModel): void {
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
      new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: model.columns,
      })
    );

    if (isIrisGridTableModelTemplate(model)) {
      this.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.TABLE_CHANGED, {
          detail: model.table,
        })
      );
    }
  }

  setNextModel(modelPromise: Promise<IrisGridModel>): void {
    log.debug2('setNextModel');

    if (this.modelPromise) {
      this.modelPromise.cancel();
    }

    if (this.listenerCount > 0) {
      this.removeListeners(this.model);
    }

    this.modelPromise = PromiseUtils.makeCancelable(
      modelPromise,
      (model: IrisGridModel) => model.close()
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
          new EventShimCustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, {
            detail: err,
          })
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

  addListeners(model: IrisGridModel): void {
    const events = Object.keys(IrisGridModel.EVENT);
    for (let i = 0; i < events.length; i += 1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      model.addEventListener(events[i], this.handleModelEvent);
    }
  }

  removeListeners(model: IrisGridModel): void {
    const events = Object.keys(IrisGridModel.EVENT);
    for (let i = 0; i < events.length; i += 1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      model.removeEventListener(events[i], this.handleModelEvent);
    }
  }

  get rowCount(): number {
    return this.model.rowCount;
  }

  get columnCount(): number {
    return this.model.columnCount;
  }

  get floatingTopRowCount(): number {
    return this.model.floatingTopRowCount;
  }

  get floatingBottomRowCount(): number {
    return this.model.floatingBottomRowCount;
  }

  get floatingLeftColumnCount(): number {
    return this.model.floatingLeftColumnCount;
  }

  get floatingRightColumnCount(): number {
    return this.model.floatingRightColumnCount;
  }

  textForCell: IrisGridModel['textForCell'] = (...args) =>
    this.model.textForCell(...args);

  truncationCharForCell: IrisGridModel['truncationCharForCell'] = (...args) =>
    this.model.truncationCharForCell(...args);

  textAlignForCell: IrisGridModel['textAlignForCell'] = (...args) =>
    this.model.textAlignForCell(...args);

  colorForCell: IrisGridModel['colorForCell'] = (...args) =>
    this.model.colorForCell(...args);

  backgroundColorForCell: IrisGridModel['backgroundColorForCell'] = (...args) =>
    this.model.backgroundColorForCell(...args);

  textForColumnHeader: IrisGridModel['textForColumnHeader'] = (...args) =>
    this.model.textForColumnHeader(...args);

  colorForColumnHeader: IrisGridModel['colorForColumnHeader'] = (...args) =>
    this.model.colorForColumnHeader(...args);

  textForRowHeader: IrisGridModel['textForRowHeader'] = (...args) =>
    this.model.textForRowHeader(...args);

  textForRowFooter: IrisGridModel['textForRowFooter'] = (...args) =>
    this.model.textForRowFooter(...args);

  isRowMovable: IrisGridModel['isRowMovable'] = (...args) =>
    this.model.isRowMovable(...args);

  isColumnMovable: IrisGridModel['isColumnMovable'] = (...args) =>
    this.model.isColumnMovable(...args);

  isColumnFrozen(x: ModelIndex): boolean {
    return this.model.isColumnFrozen(x);
  }

  get hasExpandableRows(): boolean {
    if (isExpandableGridModel(this.model)) {
      return this.model.hasExpandableRows;
    }
    return false;
  }

  isRowExpandable: IrisGridTreeTableModel['isRowExpandable'] = (...args) => {
    if (isExpandableGridModel(this.model)) {
      return this.model.isRowExpandable(...args);
    }
    return false;
  };

  isRowExpanded: IrisGridTreeTableModel['isRowExpanded'] = (...args) => {
    if (isExpandableGridModel(this.model)) {
      return this.model.isRowExpanded(...args);
    }
    return false;
  };

  setRowExpanded: IrisGridTreeTableModel['setRowExpanded'] = (...args) => {
    if (isExpandableGridModel(this.model)) {
      return this.model.setRowExpanded(...args);
    }
    throw Error('Function setRowExpanded does not exist on IrisGridTableModel');
  };

  depthForRow: IrisGridTreeTableModel['depthForRow'] = (...args) => {
    if (isExpandableGridModel(this.model)) {
      return this.model.depthForRow(...args);
    }
    return 0;
    // throw Error('Function depthForRow does not exist on IrisGridTableModel');
  };

  get isExportAvailable(): boolean {
    return this.model.isExportAvailable;
  }

  get isColumnStatisticsAvailable(): boolean {
    return this.model.isColumnStatisticsAvailable;
  }

  get isValuesTableAvailable(): boolean {
    return this.model.isValuesTableAvailable;
  }

  get isCustomColumnsAvailable(): boolean {
    return (
      this.model.isCustomColumnsAvailable &&
      // Disable for selectDistinct tables
      !(this.isSelectDistinctAvailable && this.selectDistinctColumns.length > 0)
    );
  }

  get isFormatColumnsAvailable(): boolean {
    return this.model.isFormatColumnsAvailable;
  }

  get isChartBuilderAvailable(): boolean {
    return this.model.isChartBuilderAvailable;
  }

  get isRollupAvailable(): boolean {
    return (
      (this.originalModel.isRollupAvailable || this.rollup != null) &&
      this.selectDistinct.length === 0
    );
  }

  get isSelectDistinctAvailable(): boolean {
    return (
      (this.originalModel.isSelectDistinctAvailable ||
        this.selectDistinct.length > 0) &&
      this.rollup == null
    );
  }

  get isTotalsAvailable(): boolean {
    return this.model.isTotalsAvailable;
  }

  get isReversible(): boolean {
    return this.model.isReversible;
  }

  get columns(): Column[] {
    return this.model.columns;
  }

  get movedColumns(): readonly MoveOperation[] {
    return this.model.movedColumns;
  }

  get movedRows(): readonly MoveOperation[] {
    return this.model.movedRows;
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

  getColumnHeaderGroup: IrisGridModel['getColumnHeaderGroup'] = (...args) =>
    this.model.getColumnHeaderGroup(...args);

  getColumnHeaderParentGroup: IrisGridModel['getColumnHeaderParentGroup'] = (
    ...args
  ) => this.model.getColumnHeaderParentGroup(...args);

  get columnHeaderMaxDepth(): number {
    return this.model.columnHeaderMaxDepth;
  }

  updateFrozenColumns(columns: ColumnName[]): void {
    return this.model.updateFrozenColumns(columns);
  }

  get originalColumns(): Column[] {
    return this.originalModel.columns;
  }

  get groupedColumns(): Column[] {
    return this.model.groupedColumns;
  }

  get description(): string {
    return this.model.description;
  }

  formatForCell: IrisGridModel['formatForCell'] = (...args) =>
    this.model.formatForCell(...args);

  valueForCell: IrisGridModel['valueForCell'] = (...args) =>
    this.model.valueForCell(...args);

  get filter(): readonly FilterCondition[] {
    return this.model.filter;
  }

  set filter(filter: readonly FilterCondition[]) {
    this.model.filter = filter;
  }

  get formatter(): Formatter {
    return this.model.formatter;
  }

  set formatter(formatter: Formatter) {
    this.model.formatter = formatter;
  }

  displayString: IrisGridModel['displayString'] = (...args) =>
    this.model.displayString(...args);

  get sort(): readonly Sort[] {
    return this.model.sort;
  }

  set sort(sort: readonly Sort[]) {
    this.model.sort = sort;
  }

  get customColumns(): readonly ColumnName[] {
    return this.model.customColumns;
  }

  set customColumns(customColumns: readonly ColumnName[]) {
    this.model.customColumns = customColumns;
  }

  get formatColumns(): readonly CustomColumn[] {
    return this.model.formatColumns;
  }

  set formatColumns(formatColumns: readonly CustomColumn[]) {
    this.model.formatColumns = formatColumns;
  }

  get rollupConfig(): RollupConfig | null {
    return this.rollup;
  }

  set rollupConfig(rollupConfig: RollupConfig | null) {
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

    if (
      isIrisGridTableModelTemplate(this.originalModel) &&
      rollupConfig != null
    ) {
      modelPromise = this.originalModel.table
        .rollup(rollupConfig)
        .then(table => makeModel(table, this.formatter));
    }
    this.setNextModel(modelPromise);
  }

  get selectDistinctColumns(): ColumnName[] {
    return this.selectDistinct;
  }

  set selectDistinctColumns(columnNames: string[]) {
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
      .filter(column => column != null) as Column[];

    let modelPromise = Promise.resolve(this.originalModel);

    if (
      isIrisGridTableModelTemplate(this.originalModel) &&
      selectDistinctColumns.length > 0
    ) {
      modelPromise = this.originalModel.table
        .selectDistinct(selectDistinctColumns)
        .then(table => makeModel(table, this.formatter));
    }
    this.setNextModel(modelPromise);
  }

  get table(): Table | TreeTable | undefined {
    if (isIrisGridTableModelTemplate(this.model)) {
      return this.model.table;
    }

    return undefined;
  }

  get totalsConfig(): UITotalsTableConfig | null {
    return this.model.totalsConfig;
  }

  set totalsConfig(totalsConfig: UITotalsTableConfig | null) {
    this.model.totalsConfig = totalsConfig;
  }

  get isFilterRequired(): boolean {
    return this.model.isFilterRequired;
  }

  get isEditable(): boolean {
    return isEditableGridModel(this.model) && this.model.isEditable;
  }

  isEditableRange: IrisGridTableModel['isEditableRange'] = (
    ...args
  ): boolean => {
    if (isEditableGridModel(this.model)) {
      return this.model.isEditableRange(...args);
    }
    return false;
  };

  isFilterable: IrisGridTableModel['isFilterable'] = (...args) =>
    this.model.isFilterable(...args);

  setViewport = (top: number, bottom: number, columns: Column[]): void =>
    this.model.setViewport(top, bottom, columns);

  snapshot: IrisGridModel['snapshot'] = (...args) =>
    this.model.snapshot(...args);

  textSnapshot: IrisGridTableModel['textSnapshot'] = (...args) =>
    this.model.textSnapshot(...args);

  export(): Promise<Table> {
    if (TableUtils.isTreeTable(this.model)) {
      throw new Error("TreeTable has no 'export' property");
    }
    return (this.model as IrisGridTableModel).export();
  }

  valuesTable: IrisGridTableModel['valuesTable'] = (...args) =>
    this.model.valuesTable(...args);

  columnStatistics(column: Column): Promise<ColumnStatistics> {
    if (TableUtils.isTreeTable(this.model)) {
      throw new Error("TreeTable has no 'columnStatistics' function");
    }
    return (this.model as IrisGridTableModel).columnStatistics(column);
  }

  editValueForCell: IrisGridTableModel['editValueForCell'] = (...args) => {
    if (isEditableGridModel(this.model)) {
      this.model.editValueForCell(...args);
    }
    return '';
  };

  setValueForCell: IrisGridTableModel['setValueForCell'] = (...args) => {
    if (isEditableGridModel(this.model)) {
      return this.model.setValueForCell(...args);
    }
    return Promise.reject(new Error('Model is not editable'));
  };

  setValueForRanges: IrisGridTableModel['setValueForRanges'] = (...args) => {
    if (isEditableGridModel(this.model)) {
      return this.model.setValueForRanges(...args);
    }
    return Promise.reject(new Error('Model is not editable'));
  };

  setValues: EditableGridModel['setValues'] = (...args) => {
    if (isEditableGridModel(this.model)) {
      return this.model.setValues(...args);
    }
    return Promise.resolve();
  };

  isValidForCell: IrisGridTableModel['isValidForCell'] = (...args) => {
    if (isEditableGridModel(this.model)) {
      return this.model.isValidForCell(...args);
    }
    return false;
  };

  delete: IrisGridTableModel['delete'] = (...args) =>
    this.model.delete(...args);

  get pendingDataMap(): PendingDataMap<UIRow> {
    return this.model.pendingDataMap;
  }

  set pendingDataMap(map: PendingDataMap<UIRow>) {
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

  commitPending: IrisGridTableModel['commitPending'] = (...args) =>
    this.model.commitPending(...args);

  getColumnIndexByName(name: ColumnName): number | undefined {
    return this.model.getColumnIndexByName(name);
  }
}

export default IrisGridProxyModel;
