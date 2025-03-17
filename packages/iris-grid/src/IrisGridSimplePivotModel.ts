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
import { type ModelIndex } from '@deephaven/grid';
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

export type KeyColumnArray = (readonly [string, string])[];

export type SimplePivotColumnMap = ReadonlyMap<string, string>;

// TODO:
// - textSnapshot, snapshot for the totals row

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

  private nextModel: IrisGridModel | null;

  private totalsTable: DhType.Table | null;

  private totalsRowMap: Map<string, unknown>;

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
    this.handleTotalsUpdate = this.handleTotalsUpdate.bind(this);

    this.model = makeModel(dh, table, formatter);
    this.modelPromise = null;
    this.nextModel = null;

    this.keyTable = keyTable;
    this.keyTableSubscription = null;
    this.pivotWidget = pivotWidget;
    this.totalsTable = null;
    this.totalsRowMap = new Map();

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

    // this.startListeningToTotals();

    this.setTotalsTable(totalsTable);

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
          if (!columnMap.has(column.name)) {
            return column.name.startsWith('PIVOT_C_') ? '' : column.name;
          }
          return columnMap.get(column.name);
        }
        return Reflect.get(target, prop);
      },
    });
  }

  private getCachedColumnHeaderGroups = memoize(
    (
      columnMap: SimplePivotColumnMap,
      schema: SimplePivotSchema
    ): readonly ColumnHeaderGroup[] => {
      log.debug('getPivotColumnHeaderGroups', schema.pivotDescription, {
        schema,
        columnMap: JSON.stringify([...columnMap]),
        modelColumns: JSON.stringify(this.model.columns.map(c => c.name)),
      });
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

  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    log.debug('get initialColumnHeaderGroups');
    return this.getCachedColumnHeaderGroups(this.columnMap, this.schema);
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

  get columnHeaderGroupMap(): ReadonlyMap<string, ColumnHeaderGroup> {
    log.debug('get columnHeaderGroupMap');
    return this.model.columnHeaderGroupMap;
  }

  get columnHeaderGroups(): readonly ColumnHeaderGroup[] {
    log.debug('get columnHeaderGroups');
    return this.model.columnHeaderGroups;
  }

  set columnHeaderGroups(columnHeaderGroups: readonly ColumnHeaderGroup[]) {
    log.debug('set columnHeaderGroups', columnHeaderGroups, this.model.columns);
    try {
      this.model.columnHeaderGroups = columnHeaderGroups;
    } catch (e) {
      debugger;
    }
  }

  get rowCount(): number {
    return this.model.rowCount + (this.schema.hasTotals ? 1 : 0);
  }

  valueForCell(x: ModelIndex, y: ModelIndex): unknown {
    if (this.schema.hasTotals && y === this.rowCount - 1) {
      return this.totalsRowMap.get(this.columns[x].name);
    }

    return this.model.valueForCell(x, y);
  }

  sourceColumn(x: ModelIndex, _: ModelIndex): DhType.Column {
    return this.columns[x]; // - this.schema.rowColNames.length];
  }

  textValueForCell(x: ModelIndex, y: ModelIndex): string | null | undefined {
    // Use a separate cache from memoization just for the strings that are currently displayed
    const value = this.valueForCell(x, y);
    if (value === null) {
      return null;
    }
    if (value === undefined) {
      return undefined;
    }

    const column = this.sourceColumn(x, y);
    // TODO:
    // const hasCustomColumnFormat = this.getCachedCustomColumnFormatFlag(
    //   this.formatter,
    //   column.name,
    //   column.type
    // );
    // let formatOverride;
    // if (!hasCustomColumnFormat) {
    //   const formatForCell = this.formatForCell(x, y);
    //   if (formatForCell?.formatString != null) {
    //     formatOverride = formatForCell;
    //   }
    // }
    const text = this.displayString(
      value,
      column.type,
      column.name
      // formatOverride
    );
    // this.cacheFormattedValue(x, y, text);
    return text;
  }

  textForCell(x: ModelIndex, y: ModelIndex): string {
    if (this.schema.hasTotals && y === this.rowCount - 1) {
      if (x >= this.schema.rowColNames.length) {
        return this.textValueForCell(x, y) ?? '';
      }
      return x === 0 ? 'Grand Total' : '';
    }
    return this.model.textForCell(x, y);
  }

  setTotalsTable(totalsTable: DhType.Table | null): void {
    log.debug('setTotalsTable', totalsTable);

    this.totalsTable?.removeEventListener(
      this.dh.Table.EVENT_UPDATED,
      this.handleTotalsUpdate
    );

    if (totalsTable == null) {
      this.totalsTable = null;
      return;
    }

    this.totalsTable = totalsTable;

    this.totalsTable.addEventListener<DhType.ViewportData>(
      this.dh.Table.EVENT_UPDATED,
      this.handleTotalsUpdate
    );

    this.totalsTable.setViewport(0, 0);
  }

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

  getKeyColumnMap(detail: {
    fullIndex: { iterator: () => Iterator<DhType.Row> };
    getData: (rowKey: DhType.Row, column: DhType.Column) => string;
  }): SimplePivotColumnMap {
    const pivotIdColumn = this.keyTable.findColumn('__PIVOT_COLUMN');
    const columns = this.keyTable.columns.filter(
      c => c.name !== '__PIVOT_COLUMN'
    );
    const keyColumns: KeyColumnArray = [];
    const rowIter = detail.fullIndex.iterator();
    while (rowIter.hasNext()) {
      const rowKey = rowIter.next().value;
      const value = [];
      for (let i = 0; i < columns.length; i += 1) {
        value.push(detail.getData(rowKey, columns[i]));
      }
      keyColumns.push([
        `PIVOT_C_${detail.getData(rowKey, pivotIdColumn)}`,
        value.join(', '),
      ]);
    }
    if (this.schema.hasTotals) {
      keyColumns.push(['__TOTALS_COLUMN', 'Totals']);
    }
    return new Map(keyColumns);
  }

  handleKeyTableUpdate(e: {
    detail: {
      fullIndex: { iterator: () => Iterator<DhType.Row> };
      getData: (rowKey: DhType.Row, column: DhType.Column) => string;
    };
  }): void {
    const columnMap = this.getKeyColumnMap(e.detail);
    log.debug(
      'Key table updated',
      this.model.columns.map(c => c.name),
      JSON.stringify([...columnMap]),
      Boolean(this.nextModel),
      Boolean(this.nextColumnMap)
    );

    if (this.nextModel != null) {
      if (
        this.nextModel.columns.some(
          c => c.name.startsWith('PIVOT_C_') && !columnMap.has(c.name)
        )
      ) {
        log.debug('next model not null, but columns dont match');
        this.nextColumnMap = columnMap;
      } else {
        log.debug('next model not null, all columns match');
        this.setModel(this.nextModel, columnMap);
        this.nextModel = null;
      }
    } else if (
      this.model.columns.some(
        c => c.name.startsWith('PIVOT_C_') && !columnMap.has(c.name)
      )
    ) {
      log.debug('next model is null, columns dont match - save  nextColumnMap');
      // TODO: check if current model columns match?
      this.nextColumnMap = columnMap;
    }
  }

  async handleSchemaUpdate(e: DhType.Event<DhType.Widget>): Promise<void> {
    log.debug('Schema updated', e.detail, this.schema, this.pivotWidget);
    // Get the object, and make sure the keytable is fetched and usable
    const tables = e.detail.exportedObjects;
    const tablePromise = tables[0].fetch();
    const totalsTablePromise = tables.length === 2 ? tables[1].fetch() : null;
    totalsTablePromise?.then(totalsTable => this.setTotalsTable(totalsTable));
    const newModelPromise = tablePromise.then(table =>
      makeModel(this.dh, table, this.formatter)
    );
    this.setNextModel(newModelPromise);
  }

  copyTotalsData(data: DhType.ViewportData): void {
    log.debug('[0] copyTotalsData', data);

    this.totalsRowMap = new Map();

    data.columns.forEach(column => {
      log.debug('Column', column.name, column);
      this.totalsRowMap.set(column.name, data.getData(0, column));
    });
  }

  handleTotalsUpdate(event: DhType.Event<DhType.ViewportData>): void {
    log.debug('handleTotalsUpdate', event.detail);
    this.copyTotalsData(event.detail);

    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  getCachedColumns = memoize(
    (
      columnMap: ReadonlyMap<string, string>,
      tableColumns: readonly DhType.Column[]
    ) => tableColumns.map(c => this.createDisplayColumn(c, columnMap))
  );

  get layoutHints(): DhType.LayoutHints | null | undefined {
    log.debug('get layoutHints');
    return {
      backColumns: ['__TOTALS_COLUMN'],
      hiddenColumns: [],
      frozenColumns: [],
      columnGroups: [],
      areSavedLayoutsAllowed: false,
      frontColumns: [],
    };
  }

  set layoutHints(_layoutHints: DhType.LayoutHints | null | undefined) {
    // no-op
    log.debug('set layoutHints, no-op');
  }

  /**
   * Use this as the canonical column index since things like layoutHints could have
   * changed the column order.
   */
  getColumnIndexByName(name: ColumnName): number | undefined {
    return this.getColumnIndicesByNameMap(this.columns).get(name);
  }

  getColumnIndicesByNameMap = memoize(
    (columns: DhType.Column[]): Map<ColumnName, ModelIndex> => {
      const indices = new Map();
      columns.forEach(({ name }, i) => indices.set(name, i));
      return indices;
    }
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

  setModel(model: IrisGridModel, columnMap: SimplePivotColumnMap): void {
    log.debug('setModel', model, {
      prev: JSON.stringify([...columnMap]),
      columns: JSON.stringify([...model.columns.map(c => c.name)]),
    });

    const oldModel = this.model;
    oldModel.close();

    this.model = model;
    this.columnMap = columnMap;
    this.columnHeaderGroups = this.getCachedColumnHeaderGroups(
      this.columnMap,
      this.schema
    );

    // TODO: set totals table, subscribe to updates
    if (this.listenerCount > 0) {
      this.addListeners(model);
    }
    // TODO: which events need to be dispatched on model change and in what order?
    // Dispatch model updated event
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED, {
        detail: this,
      })
    );
    if (isIrisGridTableModelTemplate(model)) {
      this.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.TABLE_CHANGED, {
          detail: model.table,
        })
      );
    }
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: model.columns,
      })
    );
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
        if (this.nextColumnMap != null) {
          log.debug(
            'Schema updated, nextColumnMap is not null, setting new model'
          );
          this.setModel(model, this.nextColumnMap);
          this.nextColumnMap = null;
        } else {
          log.debug(
            'Schema updated, nextColumnMap is null, save new model as nextModel'
          );
          this.nextModel = model;
        }
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
    this.totalsTable?.removeEventListener(
      this.dh.Table.EVENT_UPDATED,
      this.handleTotalsUpdate
    );
    this.stopListeningToKeyTable();
    this.stopListeningToSchema();
    super.close();
  }
}

export default IrisGridSimplePivotModel;
