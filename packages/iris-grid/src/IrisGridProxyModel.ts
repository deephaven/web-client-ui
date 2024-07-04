import deepEqual from 'fast-deep-equal';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
  CancelablePromise,
  EventShimCustomEvent,
  PromiseUtils,
} from '@deephaven/utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import IrisGridTableModel from './IrisGridTableModel';
import IrisGridPartitionedTableModel from './IrisGridPartitionedTableModel';
import IrisGridTreeTableModel from './IrisGridTreeTableModel';
import IrisGridModel from './IrisGridModel';
import { ColumnName } from './CommonTypes';
import { isIrisGridTableModelTemplate } from './IrisGridTableModelTemplate';
import {
  PartitionConfig,
  PartitionedGridModel,
  isPartitionedGridModelProvider,
} from './PartitionedGridModel';

const log = Log.module('IrisGridProxyModel');

function makeModel(
  dh: typeof DhType,
  table: DhType.Table | DhType.TreeTable | DhType.PartitionedTable,
  formatter?: Formatter,
  inputTable?: DhType.InputTable | null
): IrisGridModel {
  if (TableUtils.isTreeTable(table)) {
    return new IrisGridTreeTableModel(dh, table, formatter);
  }
  if (TableUtils.isPartitionedTable(table)) {
    return new IrisGridPartitionedTableModel(dh, table, formatter);
  }
  return new IrisGridTableModel(dh, table, formatter, inputTable);
}

/**
 * Model which proxies calls to other IrisGridModels.
 * This allows for operations that generate new tables, like rollups.
 * The proxy model will call any methods it has implemented and delegate any
 * it does not implement to the underlying model.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class IrisGridProxyModel extends IrisGridModel implements PartitionedGridModel {
  /**
   * @param dh JSAPI instance
   * @param table Iris data table to be used in the model
   * @param formatter The formatter to use when getting formats
   * @param inputTable Iris input table associated with this table
   */

  model: IrisGridModel;

  dh: typeof DhType;

  private originalModel: IrisGridModel;

  private modelPromise: CancelablePromise<IrisGridModel> | null;

  private rollup: DhType.RollupConfig | null;

  private partition: PartitionConfig | null;

  private selectDistinct: ColumnName[];

  private currentViewport?: {
    top: number;
    bottom: number;
    columns?: DhType.Column[];
  };

  constructor(
    dh: typeof DhType,
    table: DhType.Table | DhType.TreeTable | DhType.PartitionedTable,
    formatter = new Formatter(dh),
    inputTable: DhType.InputTable | null = null
  ) {
    super(dh);

    // The EventTarget methods must be bound to this instance
    // Otherwise they throw errors because of the Proxy
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);

    this.handleModelEvent = this.handleModelEvent.bind(this);

    const model = makeModel(dh, table, formatter, inputTable);
    this.dh = dh;
    this.originalModel = model;
    this.model = model;
    this.modelPromise = null;
    this.rollup = null;
    this.partition = null;
    this.selectDistinct = [];

    // eslint-disable-next-line no-constructor-return
    return new Proxy(this, {
      // We want to use any properties on the proxy model if defined
      // If not, then proxy to the underlying model
      get(target, prop, receiver) {
        // Does this class have a getter for the prop
        // Getter functions are on the prototype
        const proxyHasGetter =
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), prop)
            ?.get != null;

        if (proxyHasGetter) {
          return Reflect.get(target, prop, receiver);
        }

        // Does this class implement the property
        const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);

        // Does the class implement a function for the property
        const proxyHasFn = Object.prototype.hasOwnProperty.call(
          Object.getPrototypeOf(target),
          prop
        );

        const trueTarget = proxyHasProp || proxyHasFn ? target : target.model;
        return Reflect.get(trueTarget, prop);
      },
      set(target, prop, value) {
        const proxyHasSetter =
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), prop)
            ?.set != null;

        if (proxyHasSetter) {
          return Reflect.set(target, prop, value, target);
        }

        return Reflect.set(target.model, prop, value, target.model);
      },
    });
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
    const { columns: oldColumns } = oldModel;

    if (oldModel !== this.originalModel) {
      oldModel.close();
    }

    this.model = model;

    if (this.listenerCount > 0) {
      this.addListeners(model);
    }

    if (oldColumns !== model.columns) {
      this.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
          detail: model.columns,
        })
      );
    } else if (this.currentViewport != null) {
      // If the columns haven't changed, the current viewport should still valid, and needs to be set on the new model
      const { top, bottom, columns } = this.currentViewport;
      model.setViewport(top, bottom, columns);
    }

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

  get isCustomColumnsAvailable(): boolean {
    return (
      this.model.isCustomColumnsAvailable &&
      // Disable for selectDistinct tables
      !(this.isSelectDistinctAvailable && this.selectDistinctColumns.length > 0)
    );
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

  get originalColumns(): readonly DhType.Column[] {
    return this.originalModel.columns;
  }

  get partitionColumns(): readonly DhType.Column[] {
    if (!isPartitionedGridModelProvider(this.originalModel)) {
      return [];
    }
    return this.originalModel.partitionColumns;
  }

  get partitionConfig(): PartitionConfig | null {
    if (
      !isPartitionedGridModelProvider(this.originalModel) ||
      !this.originalModel.isPartitionRequired
    ) {
      return null;
    }
    return this.partition;
  }

  set partitionConfig(partitionConfig: PartitionConfig | null) {
    if (!this.isPartitionRequired) {
      throw new Error('Partitions are not available');
    }
    log.debug('set partitionConfig', partitionConfig);
    this.partition = partitionConfig;

    let modelPromise = Promise.resolve(this.originalModel);
    if (
      partitionConfig != null &&
      isPartitionedGridModelProvider(this.originalModel)
    ) {
      if (partitionConfig.mode === 'keys') {
        modelPromise = this.originalModel
          .partitionBaseTable()
          .then(table => makeModel(this.dh, table, this.formatter));
      } else if (partitionConfig.mode === 'merged') {
        modelPromise = this.originalModel
          .partitionMergedTable()
          .then(table => makeModel(this.dh, table, this.formatter));
      } else {
        modelPromise = this.originalModel
          .partitionTable(partitionConfig.partitions)
          .then(table => makeModel(this.dh, table, this.formatter));
      }
    }

    this.setNextModel(modelPromise);
  }

  partitionKeysTable(): Promise<DhType.Table> {
    if (!isPartitionedGridModelProvider(this.originalModel)) {
      throw new Error('Partitions are not available');
    }
    return this.originalModel.partitionKeysTable();
  }

  partitionMergedTable(): Promise<DhType.Table> {
    if (!isPartitionedGridModelProvider(this.originalModel)) {
      throw new Error('Partitions are not available');
    }
    return this.originalModel.partitionMergedTable();
  }

  partitionTable(partitions: unknown[]): Promise<DhType.Table> {
    if (!isPartitionedGridModelProvider(this.originalModel)) {
      throw new Error('Partitions are not available');
    }
    return this.originalModel.partitionTable(partitions);
  }

  get rollupConfig(): DhType.RollupConfig | null {
    return this.rollup;
  }

  set rollupConfig(rollupConfig: DhType.RollupConfig | null) {
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
        .then(table => makeModel(this.dh, table, this.formatter));
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
      .filter(column => column != null) as DhType.Column[];

    let modelPromise = Promise.resolve(this.originalModel);

    if (
      isIrisGridTableModelTemplate(this.originalModel) &&
      selectDistinctColumns.length > 0
    ) {
      modelPromise = this.originalModel.table
        .selectDistinct(selectDistinctColumns)
        .then(table => makeModel(this.dh, table, this.formatter));
    }
    this.setNextModel(modelPromise);
  }

  get isFilterRequired(): boolean {
    return this.originalModel.isFilterRequired;
  }

  get isPartitionRequired(): boolean {
    return isPartitionedGridModelProvider(this.originalModel)
      ? this.originalModel.isPartitionRequired
      : false;
  }

  setViewport = (
    top: number,
    bottom: number,
    columns?: DhType.Column[]
  ): void => {
    this.currentViewport = { top, bottom, columns };
    this.model.setViewport(top, bottom, columns);
  };
}

export default IrisGridProxyModel;
