import deepEqual from 'fast-deep-equal';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
  type CancelablePromise,
  EventShimCustomEvent,
  PromiseUtils,
} from '@deephaven/utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import IrisGridTableModel from './IrisGridTableModel';
import IrisGridPartitionedTableModel from './IrisGridPartitionedTableModel';
import IrisGridTreeTableModel from './IrisGridTreeTableModel';
import IrisGridModel from './IrisGridModel';
import { type ColumnName, type UITotalsTableConfig } from './CommonTypes';
import { isIrisGridTableModelTemplate } from './IrisGridTableModelTemplate';
import {
  type PartitionConfig,
  type PartitionedGridModel,
  isPartitionedGridModelProvider,
  isPartitionedGridModel,
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

    // The prototype is fixed, so how a prop resolves against it can be cached.
    // The get trap runs for every model access while rendering each cell, so
    // avoiding repeated descriptor lookups is significant.
    const PROTO_GETTER = 1;
    const PROTO_PROP = 2;
    const PROTO_NONE = 3;
    const protoLookupCache = new Map<PropertyKey, number>();
    const getProtoLookup = (target: object, prop: PropertyKey): number => {
      let lookup = protoLookupCache.get(prop);
      if (lookup === undefined) {
        const proto = Object.getPrototypeOf(target);
        const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
        if (descriptor?.get != null) {
          lookup = PROTO_GETTER;
        } else if (descriptor != null) {
          lookup = PROTO_PROP;
        } else {
          lookup = PROTO_NONE;
        }
        protoLookupCache.set(prop, lookup);
      }
      return lookup;
    };

    // Inner model class methods called on this proxy run against the inner
    // model so their internal `this` accesses don't go back through this trap,
    // which would otherwise run for every property read while rendering each
    // cell. Models wrapping this proxy (e.g. deephaven.ui's UITableModel) call
    // these methods with themselves as `this`, which is kept so their overrides
    // apply (e.g. `textForCell` calling an overridden `formatForCell`).
    // Functions that are own properties of the inner model (e.g. arrow function
    // fields, or spies replacing a method) are returned as is.
    let boundModel: IrisGridModel | null = null;
    const boundMethods = new Map<
      PropertyKey,
      { fn: (...args: unknown[]) => unknown; bound: unknown }
    >();
    const getBoundMethod = (
      innerModel: IrisGridModel,
      prop: PropertyKey,
      fn: (...args: unknown[]) => unknown
    ): unknown => {
      if (boundModel !== innerModel) {
        boundModel = innerModel;
        boundMethods.clear();
      }
      const cached = boundMethods.get(prop);
      if (cached?.fn === fn) {
        return cached.bound;
      }
      const bound = function boundInnerMethod(
        this: unknown,
        ...args: unknown[]
      ): unknown {
        return fn.apply(
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          this === proxy || this == null ? innerModel : this,
          args
        );
      };
      boundMethods.set(prop, { fn, bound });
      return bound;
    };

    const proxy = new Proxy(this, {
      // We want to use any properties on the proxy model if defined
      // If not, then proxy to the underlying model
      get(target, prop, receiver) {
        const protoLookup = getProtoLookup(target, prop);

        // Getter functions are on the prototype
        if (protoLookup === PROTO_GETTER) {
          return Reflect.get(target, prop, receiver);
        }

        if (
          protoLookup === PROTO_PROP ||
          Object.prototype.hasOwnProperty.call(target, prop)
        ) {
          return Reflect.get(target, prop);
        }

        const { model: innerModel } = target;
        const value = Reflect.get(innerModel, prop);
        if (
          typeof value !== 'function' ||
          Object.prototype.hasOwnProperty.call(innerModel, prop)
        ) {
          return value;
        }
        return getBoundMethod(innerModel, prop, value);
      },
      set(target, prop, value) {
        const proxyHasSetter =
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), prop)
            ?.set != null;

        const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);

        if (proxyHasSetter || proxyHasProp) {
          return Reflect.set(target, prop, value, target);
        }

        return Reflect.set(target.model, prop, value, target.model);
      },
      // Mirror `get` so duck-type checks (`'prop' in model`) used by inner
      // model variants (e.g. pivot) resolve against the inner model when
      // the proxy itself doesn't define the property.
      has(target, prop) {
        if (Reflect.has(target, prop)) {
          return true;
        }
        return Reflect.has(target.model, prop);
      },
    });

    // eslint-disable-next-line no-constructor-return
    return proxy;
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

    this.syncModelOptions(model);
    this.model = model;

    if (this.listenerCount > 0) {
      this.addListeners(model);
    }

    if (oldModel !== model) {
      // Signal an inner-model swap so the host can reset view state owned by
      // the previous model (e.g. `movedColumns`). Dispatched before
      // COLUMNS_CHANGED / TABLE_CHANGED so the host resets moves first, then
      // reacts to the new column set.
      this.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.SCHEMA_CHANGED, {
          detail: model,
        })
      );
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
      (model: IrisGridModel) => {
        // Don't close originalModel — it's the source-of-truth model owned
        // by this proxy, not a transient transform result. Closing it would
        // invalidate the underlying table for any consumer that later asks
        // to swap back to it.
        if (model !== this.originalModel) {
          model.close();
        }
      }
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
      // The presented model must support select distinct. Models that don't
      // (e.g. pivot models) report false here even though the underlying
      // source table would. This keeps the capability consistent with whatever
      // is currently displayed.
      this.model.isSelectDistinctAvailable &&
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
      if (!isPartitionedGridModel(this.originalModel)) {
        // @ts-expect-error If the original model has an undefined partitionConfig return undefined to make the proxy model also return false in isPartitionedGridModel
        return undefined;
      }
      return null;
    }
    return this.partition;
  }

  set partitionConfig(partitionConfig: PartitionConfig | null) {
    if (!this.isPartitionRequired) {
      throw new Error('Partitions are not available');
    }
    // Skip if config hasn't changed to avoid unnecessary model swaps (e.g. on remount)
    if (
      this.partition === partitionConfig ||
      (this.partition != null &&
        partitionConfig != null &&
        this.partition.mode === partitionConfig.mode &&
        this.partition.partitions.length ===
          partitionConfig.partitions.length &&
        this.partition.partitions.every(
          (p, i) => p === partitionConfig.partitions[i]
        ))
    ) {
      return;
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

  partitionBaseTable(): Promise<DhType.Table> {
    if (!isPartitionedGridModelProvider(this.originalModel)) {
      throw new Error('Partitions are not available');
    }
    return this.originalModel.partitionBaseTable();
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

  set totalsConfig(totalsConfig: UITotalsTableConfig | null) {
    if (this.modelPromise != null) {
      // Model switch in progress. Don't forward, as the config may reference stale columns.
      // COLUMNS_CHANGED will reapply the correct config after.
      return;
    }
    this.model.totalsConfig = totalsConfig;
  }

  get isFilterRequired(): boolean {
    return this.originalModel.isFilterRequired;
  }

  get isPartitionRequired(): boolean {
    // @ts-expect-error If the original model is not a partitioned model return undefined to make the proxy model also return false in isPartitionedGridModelProvider
    return isPartitionedGridModelProvider(this.originalModel)
      ? this.originalModel.isPartitionRequired
      : undefined;
  }

  get isPartitionAwareSourceTable(): boolean {
    return (
      isPartitionedGridModelProvider(this.originalModel) &&
      this.originalModel.isPartitionAwareSourceTable
    );
  }

  get formatter(): Formatter {
    return this.originalModel.formatter;
  }

  set formatter(formatter: Formatter) {
    this.originalModel.formatter = formatter;
    this.syncModelOptions(this.model);
  }

  get columnAlignmentMap(): ReadonlyMap<string, CanvasTextAlign> {
    return this.originalModel.columnAlignmentMap;
  }

  set columnAlignmentMap(columnAlignmentMap: Map<string, CanvasTextAlign>) {
    this.originalModel.columnAlignmentMap = columnAlignmentMap;
    this.syncModelOptions(this.model);
  }

  /**
   * Inner model methods run against the inner model, so it needs the same
   * formatter and alignment as the original model.
   */
  private syncModelOptions(model: IrisGridModel): void {
    if (model === this.originalModel) {
      return;
    }
    const { formatter, columnAlignmentMap } = this.originalModel;
    if (model.formatter !== formatter) {
      // eslint-disable-next-line no-param-reassign
      model.formatter = formatter;
    }
    if (model.columnAlignmentMap !== columnAlignmentMap) {
      // eslint-disable-next-line no-param-reassign
      model.columnAlignmentMap = columnAlignmentMap as Map<
        string,
        CanvasTextAlign
      >;
    }
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
