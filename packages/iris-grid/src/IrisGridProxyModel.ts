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
import IrisGridTableModel, {
  PendingDataMap,
  UIRow,
} from './IrisGridTableModel';
import IrisGridTreeTableModel, { UITreeRow } from './IrisGridTreeTableModel';
import IrisGridModel from './IrisGridModel';
import { UITotalsTableConfig } from './IrisGrid';

const log = Log.module('IrisGridProxyModel');

function makeModel(
  table: Table | TreeTable,
  formatter?: Formatter,
  inputTable?: InputTable | null
) {
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

  rollup: RollupConfig | null;

  selectDistinct: string[];

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
      new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: model.columns,
      })
    );

    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.TABLE_CHANGED, {
        detail: model.table,
      })
    );
  }

  setNextModel(
    modelPromise:
      | IrisGridTreeTableModel
      | IrisGridTableModel
      | Promise<IrisGridTreeTableModel | IrisGridTableModel>
  ): void {
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

  addListeners(model: IrisGridTreeTableModel | IrisGridTableModel): void {
    const events = Object.keys(IrisGridModel.EVENT);
    for (let i = 0; i < events.length; i += 1) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      model.addEventListener(events[i], this.handleModelEvent);
    }
  }

  removeListeners(model: IrisGridTreeTableModel | IrisGridTableModel): void {
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

  textForCell: IrisGridTableModel['textForCell'] = (...args) =>
    this.model.textForCell(...args);

  truncationCharForCell: IrisGridTableModel['truncationCharForCell'] = (
    ...args
  ) => this.model.truncationCharForCell(...args);

  textAlignForCell: IrisGridTableModel['textAlignForCell'] = (...args) =>
    this.model.textAlignForCell(...args);

  colorForCell: IrisGridTableModel['colorForCell'] = (...args) =>
    this.model.colorForCell(...args);

  backgroundColorForCell: IrisGridTableModel['backgroundColorForCell'] = (
    ...args
  ) => this.model.backgroundColorForCell(...args);

  textForColumnHeader: IrisGridTableModel['textForColumnHeader'] = (...args) =>
    this.model.textForColumnHeader(...args);

  textForRowHeader: IrisGridTableModel['textForRowHeader'] = (...args) =>
    this.model.textForRowHeader(...args);

  textForRowFooter: IrisGridTableModel['textForRowFooter'] = (...args) =>
    this.model.textForRowFooter(...args);

  isRowMovable: IrisGridTableModel['isRowMovable'] = (...args) =>
    this.model.isRowMovable(...args);

  isColumnMovable: IrisGridTableModel['isColumnMovable'] = (...args) =>
    this.model.isColumnMovable(...args);

  isColumnFrozen(x: number): boolean {
    if (TableUtils.isTreeTable(this.table)) {
      throw new Error('TreeTable cannot be frozen');
    }
    return (this.model as IrisGridTableModel).isColumnFrozen(x);
  }

  get hasExpandableRows(): boolean {
    if (TableUtils.isTreeTable(this.model.table)) {
      return (this.model as IrisGridTreeTableModel).hasExpandableRows;
    }
    return false;
  }

  isRowExpandable: IrisGridTreeTableModel['isRowExpandable'] = (...args) => {
    if (TableUtils.isTreeTable(this.model.table)) {
      return (this.model as IrisGridTreeTableModel).isRowExpandable(...args);
    }
    throw Error(
      'Function isRowExpandable does not exist on IrisGridTableModel'
    );
  };

  isRowExpanded: IrisGridTreeTableModel['isRowExpanded'] = (...args) => {
    if (TableUtils.isTreeTable(this.model.table)) {
      return (this.model as IrisGridTreeTableModel).isRowExpanded(...args);
    }
    throw Error('Function isRowExpanded does not exist on IrisGridTableModel');
  };

  setRowExpanded: IrisGridTreeTableModel['setRowExpanded'] = (...args) => {
    if (TableUtils.isTreeTable(this.model.table)) {
      return (this.model as IrisGridTreeTableModel).setRowExpanded(...args);
    }
    throw Error('Function setRowExpanded does not exist on IrisGridTableModel');
  };

  depthForRow: IrisGridTreeTableModel['depthForRow'] = (...args) => {
    if (TableUtils.isTreeTable(this.model.table)) {
      return (this.model as IrisGridTreeTableModel).depthForRow(...args);
    }
    return 0;
    // throw Error('Function depthForRow does not exist on IrisGridTableModel');
  };

  get table(): Table | TreeTable {
    return this.model.table;
  }

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

  get movedColumns() {
    return this.model.movedColumns;
  }

  get movedRows() {
    return this.model.movedRows;
  }

  get layoutHints(): LayoutHints | null {
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

  updateFrozenColumns(columns: string[]): void {
    if (TableUtils.isTreeTable(this.table)) {
      throw new Error('TreeTable cannot be frozen');
    }
    return (this.model as IrisGridTableModel).updateFrozenColumns(columns);
  }

  get originalColumns(): Column[] {
    return this.originalModel.columns;
  }

  get groupedColumns(): Column[] {
    return this.model.groupedColumns;
  }

  get description(): string {
    if (TableUtils.isTreeTable(this.table)) {
      throw new Error("TreeTable does not have property 'description'");
    }
    return (this.model as IrisGridTableModel).description;
  }

  formatForCell: IrisGridTableModel['formatForCell'] = (...args) =>
    this.model.formatForCell(...args);

  valueForCell: IrisGridTableModel['valueForCell'] = (...args) =>
    this.model.valueForCell(...args);

  get filter(): FilterCondition[] {
    return this.model.filter;
  }

  set filter(filter: FilterCondition[]) {
    this.model.filter = filter;
  }

  get formatter(): Formatter {
    return this.model.formatter;
  }

  set formatter(formatter: Formatter) {
    this.model.formatter = formatter;
  }

  displayString: IrisGridTableModel['displayString'] = (...args) =>
    this.model.displayString(...args);

  get sort(): Sort[] {
    return this.model.sort;
  }

  set sort(sort: Sort[]) {
    this.model.sort = sort;
  }

  get customColumns(): string[] {
    if (TableUtils.isTreeTable(this.table)) {
      throw new Error("TreeTable does not have property 'customColumns'");
    }
    return (this.model as IrisGridTableModel).customColumns;
  }

  set customColumns(customColumns: string[]) {
    if (TableUtils.isTreeTable(this.table)) {
      throw new Error("TreeTable does not have property 'customColumns'");
    }
    (this.model as IrisGridTableModel).customColumns = customColumns;
  }

  get formatColumns(): CustomColumn[] {
    if (TableUtils.isTreeTable(this.table)) {
      throw new Error("TreeTable does not have property 'formatColumns'");
    }
    return (this.model as IrisGridTableModel).formatColumns;
  }

  set formatColumns(formatColumns: CustomColumn[]) {
    if (TableUtils.isTreeTable(this.table)) {
      throw new Error("TreeTable does not have property 'formatColumns'");
    }
    (this.model as IrisGridTableModel).formatColumns = formatColumns;
  }

  get rollupConfig(): RollupConfig | null {
    return this.rollup;
  }

  set rollupConfig(rollupConfig: RollupConfig | null) {
    if (TableUtils.isTreeTable(this.table)) {
      throw new Error("TreeTable does not have property 'rollupConfig'");
    }

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
      modelPromise = (this.originalModel.table as Table)
        .rollup(rollupConfig)
        .then(table => makeModel(table, this.formatter));
    }
    this.setNextModel(modelPromise);
  }

  get selectDistinctColumns(): string[] {
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

    if (columnNames.length > 0) {
      modelPromise = this.originalModel.table
        .selectDistinct(selectDistinctColumns)
        .then(table => makeModel(table, this.formatter));
    }
    this.setNextModel(modelPromise);
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
    return this.model.isEditable;
  }

  isEditableRange: IrisGridTableModel['isEditableRange'] = (...args) =>
    this.model.isEditableRange(...args);

  isFilterable: IrisGridTableModel['isFilterable'] = (...args) =>
    this.model.isFilterable(...args);

  setViewport = (top: number, bottom: number, columns: Column[]): void =>
    this.model.setViewport(top, bottom, columns);

  snapshot: IrisGridTableModel['snapshot'] = (...args) =>
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

  editValueForCell: IrisGridTableModel['editValueForCell'] = (...args) =>
    this.model.editValueForCell(...args);

  setValueForCell: IrisGridTableModel['setValueForCell'] = (...args) =>
    this.model.setValueForCell(...args);

  setValueForRanges: IrisGridTableModel['setValueForRanges'] = (...args) =>
    this.model.setValueForRanges(...args);

  setValues: IrisGridTableModel['setValues'] = (...args) =>
    this.model.setValues(...args);

  isValidForCell: IrisGridTableModel['isValidForCell'] = (...args) =>
    this.model.isValidForCell(...args);

  delete: IrisGridTableModel['delete'] = (...args) =>
    this.model.delete(...args);

  get pendingDataMap(): PendingDataMap<UIRow | UITreeRow> {
    return this.model.pendingDataMap;
  }

  set pendingDataMap(map: PendingDataMap<UIRow | UITreeRow>) {
    this.model.pendingDataMap = map;
  }

  get pendingRowCount(): number {
    return this.model.pendingRowCount;
  }

  set pendingRowCount(count: number) {
    this.model.pendingRowCount = count;
  }

  get pendingDataErrors(): Map<number, Error[]> {
    return this.model.pendingDataErrors;
  }

  commitPending: IrisGridTableModel['commitPending'] = (...args) =>
    this.model.commitPending(...args);

  getColumnIndexByName(name: string): number | undefined {
    return this.model.getColumnIndexByName(name);
  }
}

export default IrisGridProxyModel;
