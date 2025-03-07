/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import type { dh as DhType, Iterator } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { Formatter } from '@deephaven/jsapi-utils';
import {
  EventShimCustomEvent,
  PromiseUtils,
  type CancelablePromise,
} from '@deephaven/utils';
import { type ColumnName, type UITotalsTableConfig } from './CommonTypes';
import type { DisplayColumn } from './IrisGridModel';
import ColumnHeaderGroup from './ColumnHeaderGroup';
import IrisGridModel from './IrisGridModel';
import IrisGridTableModel from './IrisGridTableModel';
import { isIrisGridTableModelTemplate } from './IrisGridTableModelTemplate';

const log = Log.module('IrisGridSimplePivotModel');

function makeModel(
  dh: typeof DhType,
  table: DhType.Table,
  formatter?: Formatter
): IrisGridModel {
  return new IrisGridTableModel(dh, table, formatter);
}

export interface SimplePivotSchema {
  columnColNames: string[];
  rowColNames: string[];
  hasTotals: boolean;
  pivotDescription: string;
}

export type SimplePivotColumnMap = ReadonlyMap<string, string>;

/**
 * Model which proxies calls to IrisGridModel.
 * This allows updating the underlying Simple Pivot tables on schema changes.
 * The proxy model will call any methods it has implemented and delegate any
 * it does not implement to the underlying model.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class IrisGridSimplePivotModel extends IrisGridModel {
  private keyTable: DhType.Table;

  private keyTableSubscription: DhType.TableSubscription | null;

  private columnMap: SimplePivotColumnMap;

  private nextColumnMap: SimplePivotColumnMap | null;

  private schema: SimplePivotSchema;

  private pivotWidget: DhType.Widget;

  model: IrisGridModel;

  private modelPromise: CancelablePromise<IrisGridModel> | null;

  constructor(
    dh: typeof DhType,
    table: DhType.Table,
    keyTable: DhType.Table,
    totalsTable: DhType.Table | null,
    columnMap: (readonly [string, string])[],
    schema: SimplePivotSchema,
    pivotWidget: DhType.Widget,
    formatter = new Formatter(dh)
  ) {
    super(dh);

    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);

    this.handleModelEvent = this.handleModelEvent.bind(this);

    this.handleKeyTableUpdate = this.handleKeyTableUpdate.bind(this);
    this.handleSchemaUpdate = this.handleSchemaUpdate.bind(this);

    this.model = makeModel(dh, table, formatter);
    this.modelPromise = null;

    this.keyTable = keyTable;
    this.keyTableSubscription = null;
    this.pivotWidget = pivotWidget;

    this.columnMap = new Map(
      schema.hasTotals
        ? [['__TOTALS_COLUMN', 'Totals'], ...columnMap]
        : columnMap
    );
    this.nextColumnMap = null;
    this.pivotWidget = pivotWidget;
    this.schema = schema;

    this.startListeningToKeyTable();

    this.startListeningToSchema();

    // TODO:
    // this.setTotalsTable(totalsTable);
    // this.setInitialTotalsConfig(totalsTable);

    log.debug(
      '[0] IrisGridSimplePivotModel constructor',
      columnMap,
      totalsTable,
      this.columnMap,
      schema
    );

    // Proxy everything to the underlying model, unless overridden
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

        const proxyHasProp = Object.prototype.hasOwnProperty.call(target, prop);

        if (proxyHasSetter || proxyHasProp) {
          return Reflect.set(target, prop, value, target);
        }

        return Reflect.set(target.model, prop, value, target.model);
      },
    });
  }

  /**
   * Add displayName property from the column map to the given column
   * @param column Column to add displayName to
   * @param columnMap Column name map
   * @returns Column with the displayName
   */
  private createDisplayColumn(
    column: DhType.Column,
    columnMap: SimplePivotColumnMap
  ): DisplayColumn {
    return new Proxy(column, {
      get: (target, prop) => {
        if (prop === 'displayName') {
          return columnMap.get(column.name) ?? '';
        }
        return Reflect.get(target, prop);
      },
    });
  }

  private getCachedPivotColumnHeaderGroups = memoize(
    (
      columnMap: SimplePivotColumnMap,
      schema: SimplePivotSchema
    ): ColumnHeaderGroup[] => {
      log.debug(
        'getPivotColumnHeaderGroups',
        schema,
        JSON.stringify([...columnMap]),
        JSON.stringify(this.model.columns)
      );
      return [
        new ColumnHeaderGroup({
          name: schema.pivotDescription,
          children: schema.rowColNames,
          depth: 1,
          childIndexes: schema.rowColNames.map((_, index) => index),
        }),
        new ColumnHeaderGroup({
          name: schema.columnColNames.join(', '),
          children: [...columnMap.keys()],
          depth: 1,
          childIndexes: [...columnMap.keys()].map((_, index) => index),
        }),
      ];
    }
  );

  get initialColumnHeaderGroups(): ColumnHeaderGroup[] {
    return this.getCachedPivotColumnHeaderGroups(this.columnMap, this.schema);
  }

  get columns(): DhType.Column[] {
    return this.getCachedColumns(this.columnMap, this.model.columns);
  }

  get isChartBuilderAvailable(): boolean {
    return false;
  }

  get isSelectDistinctAvailable(): boolean {
    return false;
  }

  get isReversible(): boolean {
    return false;
  }

  get isTotalsAvailable(): boolean {
    // Hide Aggregate Columns option in Table Settings
    return false;
  }

  get isRollupAvailable(): boolean {
    return false;
  }

  get isCustomColumnsAvailable(): boolean {
    return false;
  }

  set totalsConfig(_: UITotalsTableConfig | null) {
    // no-op
  }

  // setInitialTotalsConfig(totalsTable: DhType.Table | null): void {
  //   if (totalsTable == null) {
  //     this.totals = null;
  //     return;
  //   }
  //   const operation = AggregationOperation.SUM;

  //   const operationMap: OperationMap = {};
  //   totalsTable?.columns.forEach(({ name }) => {
  //     const newOperations = [...(operationMap[name] ?? []), operation];
  //     operationMap[name] = Object.freeze(newOperations);
  //   });

  //   const totalsConfig: UITotalsTableConfig = {
  //     defaultOperation: 'Skip',
  //     operationOrder: [operation],
  //     showOnTop: false,
  //     operationMap,
  //   } as UITotalsTableConfig;

  //   this.totals = totalsConfig;
  // }

  startListeningToKeyTable(): void {
    const { dh, keyTable } = this;
    log.debug('Start Listening to key table', keyTable);
    this.keyTableSubscription = keyTable.subscribe(keyTable.columns);
    this.keyTableSubscription.addEventListener<{
      fullIndex: { iterator: () => Iterator<DhType.Row> };
      getData: (rowKey: DhType.Row, column: DhType.Column) => string;
    }>(dh.Table.EVENT_UPDATED, this.handleKeyTableUpdate);
  }

  stopListeningToKeyTable(): void {
    log.debug(
      'Stop Listening to key table subscription',
      this.keyTableSubscription
    );
    this.keyTableSubscription?.close();
    this.keyTableSubscription = null;
  }

  startListeningToSchema(): void {
    const { dh, pivotWidget } = this;
    log.debug('Start Listening to schema', pivotWidget);
    pivotWidget.addEventListener<DhType.Widget>(
      dh.Widget.EVENT_MESSAGE,
      this.handleSchemaUpdate
    );
  }

  stopListeningToSchema(): void {
    const { dh, pivotWidget } = this;
    log.debug('Stop Listening to schema', pivotWidget);
    pivotWidget.removeEventListener(
      dh.Widget.EVENT_MESSAGE,
      this.handleSchemaUpdate
    );
  }

  handleKeyTableUpdate(e: {
    detail: {
      fullIndex: { iterator: () => Iterator<DhType.Row> };
      getData: (rowKey: DhType.Row, column: DhType.Column) => string;
    };
  }): void {
    log.debug('Key table updated', e.detail);
    const pivotIdColumn = this.keyTable.findColumn('__PIVOT_COLUMN');
    const columns = this.keyTable.columns.filter(
      c => c.name !== '__PIVOT_COLUMN'
    );
    const columnMap: (readonly [string, string])[] = [];
    const data = e.detail;
    const rowIter = data.fullIndex.iterator();
    while (rowIter.hasNext()) {
      const rowKey = rowIter.next().value;
      const value = [];
      for (let i = 0; i < columns.length; i += 1) {
        value.push(data.getData(rowKey, columns[i]));
      }
      columnMap.push([
        `PIVOT_C_${data.getData(rowKey, pivotIdColumn)}`,
        value.join(', '),
      ]);
    }
    this.nextColumnMap = new Map(
      this.schema.hasTotals
        ? [['__TOTALS_COLUMN', 'Totals'], ...columnMap]
        : columnMap
    );
    log.debug(
      'Column map updated',
      columnMap,
      this.columnMap,
      this.nextColumnMap
    );
  }

  async handleSchemaUpdate(e: DhType.Event<DhType.Widget>): Promise<void> {
    log.debug('Schema updated', e.detail, this.schema, this.pivotWidget);
    // Get the object, and make sure the keytable is fetched and usable
    const tables = e.detail.exportedObjects;
    const tablePromise = tables[0].fetch();

    // TODO: set totals table, subscribe to updates

    const newModelPromise = tablePromise.then(table =>
      makeModel(this.dh, table, this.formatter)
    );
    this.setNextModel(newModelPromise);
  }

  getCachedColumns = memoize(
    (
      columnMap: ReadonlyMap<string, string>,
      tableColumns: readonly DhType.Column[]
    ) => tableColumns.map(c => this.createDisplayColumn(c, columnMap))
  );

  updateFrozenColumns(columns: ColumnName[]): void {
    if (columns.length > 0) {
      throw new Error('Cannot freeze columns on a pivot table');
    }
  }

  handleModelEvent(event: CustomEvent): void {
    log.debug2('handleModelEvent', event);

    const { detail, type } = event;
    this.dispatchEvent(new EventShimCustomEvent(type, { detail }));
  }

  setModel(model: IrisGridModel): void {
    log.debug('setModel', model, {
      prev: JSON.stringify(this.columnMap),
      next: JSON.stringify(this.nextColumnMap),
      columns: JSON.stringify(model.columns),
    });

    const oldModel = this.model;
    oldModel.close();

    this.model = model;
    this.columnMap = this.nextColumnMap ?? this.columnMap;
    this.columnHeaderGroups = this.getCachedPivotColumnHeaderGroups(
      this.columnMap,
      this.schema
    );
    this.nextColumnMap = null;

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

  close(): void {
    log.debug('close');

    this.stopListeningToKeyTable();
    this.stopListeningToSchema();
    super.close();
  }
}

export default IrisGridSimplePivotModel;
