/* eslint class-methods-use-this: "off" */
/* eslint no-underscore-dangle: "off" */
import memoize from 'memoize-one';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import {
  assertNotNull,
  EventShimCustomEvent,
  PromiseUtils,
  type CancelablePromise,
} from '@deephaven/utils';
import { GridRange, type ModelIndex } from '@deephaven/grid';
import { type ColumnName } from './CommonTypes';
import type { DisplayColumn } from './IrisGridModel';
import ColumnHeaderGroup from './ColumnHeaderGroup';
import IrisGridModel from './IrisGridModel';
import IrisGridTableModel from './IrisGridTableModel';
import { isIrisGridTableModelTemplate } from './IrisGridTableModelTemplate';
import IrisGridUtils from './IrisGridUtils';
import type { IrisGridThemeType } from './IrisGridTheme';
import {
  getSimplePivotColumnMap,
  isColumnMapComplete,
  KEY_TABLE_PIVOT_COLUMN,
  TOTALS_COLUMN,
  type KeyColumnArray,
  type KeyTableSubscriptionData,
  type SimplePivotColumnMap,
  type SimplePivotSchema,
} from './SimplePivotUtils';

const log = Log.module('IrisGridSimplePivotModel');

function makeModel(
  dh: typeof DhType,
  table: DhType.Table,
  formatter?: Formatter
): IrisGridModel {
  return new IrisGridTableModel(dh, table, formatter);
}

const GRAND_TOTAL_VALUE = 'Grand Total';

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

  private schemaPromise: CancelablePromise<[DhType.Table, DhType.Table]> | null;

  private nextModel: IrisGridModel | null;

  private totalsTable: DhType.Table | null;

  private nextTotalsTable: DhType.Table | null;

  private totalsRowMap: Map<string, unknown>;

  private _layoutHints: DhType.LayoutHints | null | undefined;

  constructor(
    dh: typeof DhType,
    table: DhType.Table,
    keyTable: DhType.Table,
    totalsTable: DhType.Table | null,
    columnMap: KeyColumnArray,
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
    this.schemaPromise = null;
    this.nextModel = null;

    this.keyTable = keyTable;
    this.keyTableSubscription = null;
    this.pivotWidget = pivotWidget;
    this.totalsTable = null;
    this.nextTotalsTable = null;
    this.totalsRowMap = new Map();

    this.columnMap = new Map(
      schema.hasTotals ? [[TOTALS_COLUMN, 'Totals'], ...columnMap] : columnMap
    );
    this.nextColumnMap = null;
    this.pivotWidget = pivotWidget;
    this.schema = schema;

    this._layoutHints = {
      backColumns: [TOTALS_COLUMN],
      hiddenColumns: [],
      frozenColumns: [],
      columnGroups: [],
      areSavedLayoutsAllowed: false,
      frontColumns: [],
      searchDisplayMode: this.dh.SearchDisplayMode.SEARCH_DISPLAY_HIDE,
    };

    this.startListeningToKeyTable();

    this.startListeningToSchema();

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
   * Add displayName property to the given column
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
          return columnMap.get(column.name) ?? column.name;
        }
        return Reflect.get(target, prop);
      },
    });
  }

  private getCachedColumnHeaderGroups = memoize(
    (
      columns: readonly DisplayColumn[],
      schema: SimplePivotSchema
    ): readonly ColumnHeaderGroup[] => {
      const { rowColNames, columnColNames } = schema;
      const columnNamesGroup = columns.filter(
        c => !rowColNames.includes(c.name)
      );
      return [
        new ColumnHeaderGroup({
          name: schema.pivotDescription,
          children: rowColNames,
          depth: 1,
          childIndexes: rowColNames.map((_, index) => index),
        }),
        new ColumnHeaderGroup({
          name: columnColNames.join(', '),
          children: columnNamesGroup.map(c => c.name),
          depth: 1,
          childIndexes: columnNamesGroup.map(
            (_, index) => rowColNames.length + index
          ),
        }),
      ];
    }
  );

  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    log.debug('get initialColumnHeaderGroups');
    return this.getCachedColumnHeaderGroups(this.model.columns, this.schema);
  }

  get columns(): DhType.Column[] {
    return this.getCachedColumns(this.columnMap, this.model.columns);
  }

  get isChartBuilderAvailable(): boolean {
    return false;
  }

  get isFormatColumnsAvailable(): boolean {
    return false;
  }

  get isOrganizeColumnsAvailable(): boolean {
    return false;
  }

  get isSeekRowAvailable(): boolean {
    return false;
  }

  get isSelectDistinctAvailable(): boolean {
    return false;
  }

  get isReversible(): boolean {
    return false;
  }

  isFilterable(columnIndex: ModelIndex): boolean {
    return columnIndex < this.schema.rowColNames.length;
  }

  isColumnSortable(columnIndex: ModelIndex): boolean {
    return columnIndex < this.schema.rowColNames.length;
  }

  get isTotalsAvailable(): boolean {
    // Hide Aggregate Columns option in Table Settings
    return false;
  }

  get isRollupAvailable(): boolean {
    return false;
  }

  get isExportAvailable(): boolean {
    // table.freeze is available, but exporting requires extra logic for column mapping and totals rows
    return false;
  }

  get isCustomColumnsAvailable(): boolean {
    return false;
  }

  get rowCount(): number {
    return this.model.rowCount + (this.schema.hasTotals ? 1 : 0);
  }

  valueForCell(x: ModelIndex, y: ModelIndex): unknown {
    if (this.schema.hasTotals && y === this.rowCount - 1) {
      if (x >= this.schema.rowColNames.length) {
        return this.totalsRowMap.get(this.columns[x].name);
      }
      return x === 0 ? GRAND_TOTAL_VALUE : undefined;
    }
    return this.model.valueForCell(x, y);
  }

  textForCell(x: ModelIndex, y: ModelIndex): string {
    return this.schema.hasTotals && y === this.rowCount - 1 && x === 0
      ? GRAND_TOTAL_VALUE
      : // Pass the context so model.textForCell calls this.valueForCell instead of model.valueForCell
        this.model.textForCell.call(this, x, y);
  }

  setTotalsTable(totalsTable: DhType.Table | null): void {
    log.debug('setTotalsTable', totalsTable);
    this.stopListeningToTotals();

    if (totalsTable == null) {
      this.totalsTable = null;
      return;
    }

    this.totalsTable = totalsTable;
    this.startListeningToTotals();
    this.totalsTable.setViewport(0, 0);
  }

  startListeningToKeyTable(): void {
    const { dh, keyTable } = this;
    log.debug('Start Listening to key table');
    this.keyTableSubscription = keyTable.subscribe(keyTable.columns);
    this.keyTableSubscription.addEventListener<KeyTableSubscriptionData>(
      dh.Table.EVENT_UPDATED,
      this.handleKeyTableUpdate
    );
  }

  stopListeningToKeyTable(): void {
    log.debug('Stop Listening to key table subscription');
    this.keyTableSubscription?.close();
    this.keyTableSubscription = null;
  }

  startListeningToSchema(): void {
    const { dh, pivotWidget } = this;
    log.debug('Start Listening to schema');
    pivotWidget.addEventListener<DhType.Widget>(
      dh.Widget.EVENT_MESSAGE,
      this.handleSchemaUpdate
    );
  }

  stopListeningToSchema(): void {
    const { dh, pivotWidget } = this;
    log.debug('Stop Listening to schema');
    pivotWidget.removeEventListener(
      dh.Widget.EVENT_MESSAGE,
      this.handleSchemaUpdate
    );
  }

  startListeningToTotals(): void {
    log.debug('Start Listening to totals table');
    this.totalsTable?.addEventListener(
      this.dh.Table.EVENT_UPDATED,
      this.handleTotalsUpdate
    );
  }

  stopListeningToTotals(): void {
    log.debug('Stop Listening to totals table');
    this.totalsTable?.removeEventListener(
      this.dh.Table.EVENT_UPDATED,
      this.handleTotalsUpdate
    );
  }

  handleKeyTableUpdate(e: { detail: KeyTableSubscriptionData }): void {
    log.debug('Key table updated');
    const pivotIdColumn = this.keyTable.findColumn(KEY_TABLE_PIVOT_COLUMN);
    const columns = this.keyTable.columns.filter(
      c => c.name !== KEY_TABLE_PIVOT_COLUMN
    );
    const keyColumns = getSimplePivotColumnMap(
      e.detail,
      columns,
      pivotIdColumn
    );
    if (this.schema.hasTotals) {
      keyColumns.push([TOTALS_COLUMN, 'Totals']);
    }
    const columnMap = new Map(keyColumns);

    if (this.nextModel == null) {
      if (isColumnMapComplete(columnMap, this.model.columns)) {
        log.debug2(
          'Key table update matches the existing model, update columns'
        );
        this.columnMap = columnMap;
        this.columnHeaderGroups = this.getCachedColumnHeaderGroups(
          this.model.columns,
          this.schema
        );
        this.dispatchEvent(
          new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
            detail: this.columns,
          })
        );
      } else {
        log.debug2(
          'Key table update does not match the existing model, save column map for the next schema update'
        );
        this.nextColumnMap = columnMap;
      }
      return;
    }
    if (isColumnMapComplete(columnMap, this.nextModel.columns)) {
      log.debug2('Key table update matches the saved model, update the model');
      assertNotNull(this.nextTotalsTable);
      this.setModel(this.nextModel, columnMap, this.nextTotalsTable);
      this.nextModel = null;
      this.nextTotalsTable = null;
    } else {
      log.debug2(
        'Key table update does not match the saved model, save column map for the next schema update'
      );
      this.nextColumnMap = columnMap;
    }
  }

  async handleSchemaUpdate(e: DhType.Event<DhType.Widget>): Promise<void> {
    log.debug('Schema updated');
    const tables = e.detail.exportedObjects;
    const tablePromise = tables[0].fetch();
    const totalsTablePromise = tables.length === 2 ? tables[1].fetch() : null;
    const pivotTablesPromise = Promise.all([tablePromise, totalsTablePromise]);
    this.setNextSchema(pivotTablesPromise);
  }

  copyTotalsData(data: DhType.ViewportData): void {
    this.totalsRowMap = new Map();
    data.columns.forEach(column => {
      this.totalsRowMap.set(column.name, data.getData(0, column));
    });
  }

  handleTotalsUpdate(event: DhType.Event<DhType.ViewportData>): void {
    log.debug('handleTotalsUpdate', event.detail);

    this.copyTotalsData(event.detail);
    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  getCachedColumns = memoize(
    (columnMap: SimplePivotColumnMap, tableColumns: readonly DhType.Column[]) =>
      tableColumns.map(c => this.createDisplayColumn(c, columnMap))
  );

  get layoutHints(): DhType.LayoutHints | null | undefined {
    return this._layoutHints;
  }

  set columnHeaderGroups(columnHeaderGroups: readonly ColumnHeaderGroup[]) {
    this.model.columnHeaderGroups = columnHeaderGroups;
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

  setModel(
    model: IrisGridModel,
    columnMap: SimplePivotColumnMap,
    totalsTable: DhType.Table
  ): void {
    log.debug('setModel', model);

    const oldModel = this.model;
    oldModel.close();
    if (this.listenerCount > 0) {
      this.removeListeners(oldModel);
    }

    this.model = model;
    this.setTotalsTable(totalsTable);
    this.columnMap = columnMap;
    this.columnHeaderGroups = this.getCachedColumnHeaderGroups(
      this.model.columns,
      this.schema
    );

    if (
      !isIrisGridTableModelTemplate(model) ||
      !isIrisGridTableModelTemplate(oldModel)
    ) {
      throw new Error('Invalid model, setModel not available');
    }
    if (this.listenerCount > 0) {
      this.addListeners(model);
    }

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
        detail: this.columns,
      })
    );
  }

  setNextSchema(
    pivotTablesPromise: Promise<[DhType.Table, DhType.Table]>
  ): void {
    if (this.schemaPromise) {
      this.schemaPromise.cancel();
    }

    this.schemaPromise = PromiseUtils.makeCancelable(
      pivotTablesPromise,
      ([table, totalsTable]: [DhType.Table, DhType.Table]) => {
        table.close();
        totalsTable.close();
      }
    );
    this.schemaPromise
      .then(([table, totalsTable]) => {
        log.debug('Schema updated');
        this.schemaPromise = null;
        const model = makeModel(this.dh, table, this.formatter);
        if (this.nextColumnMap != null) {
          if (isColumnMapComplete(this.nextColumnMap, model.columns)) {
            log.debug2(
              'Schema updated, set new model with the saved column map'
            );
            this.setModel(model, this.nextColumnMap, totalsTable);
            this.nextColumnMap = null;
          } else {
            log.debug2(
              'Saved column map does not match the new model, save the model for the next key table update'
            );
            this.nextModel = model;
            this.nextTotalsTable = totalsTable;
          }
          return;
        }
        if (isColumnMapComplete(this.columnMap, model.columns)) {
          log.debug2('Schema updated, set new model with existing column map');
          this.setModel(model, this.columnMap, totalsTable);
        } else {
          log.debug2(
            'Existing column map does not match the new model, save the model for the next key table update'
          );
          this.nextModel = model;
          this.nextTotalsTable = totalsTable;
        }
      })
      .catch((err: unknown) => {
        if (PromiseUtils.isCanceled(err)) {
          log.debug2('setNextSchema cancelled');
          return;
        }

        log.error('Unable to set next model', err);
        this.schemaPromise = null;

        this.dispatchEvent(
          new EventShimCustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, {
            detail: err,
          })
        );
      });
  }

  async snapshot(
    ranges: readonly GridRange[],
    includeHeaders = false,
    formatValue: (value: unknown, column: DhType.Column) => unknown = value =>
      value,
    consolidateRanges = true
  ): Promise<unknown[][]> {
    if (!isIrisGridTableModelTemplate(this.model)) {
      throw new Error('Invalid model, snapshot not available');
    }

    const consolidated = consolidateRanges
      ? GridRange.consolidate(ranges)
      : ranges;
    if (!IrisGridUtils.isValidSnapshotRanges(consolidated)) {
      throw new Error(`Invalid snapshot ranges ${ranges}`);
    }

    let hasTotals = false;
    const tableRanges: GridRange[] = [];

    const tableSize = this.model.table.size;

    for (let i = 0; i < consolidated.length; i += 1) {
      const range = consolidated[i];
      assertNotNull(range.endRow);
      assertNotNull(range.startRow);
      // Separate out the range that is part of the actual table
      if (range.endRow === tableSize) {
        hasTotals = true;
        if (range.startRow < tableSize) {
          tableRanges.push(
            new GridRange(
              range.startColumn,
              range.startRow,
              range.endColumn,
              range.endRow - 1
            )
          );
        }
      } else {
        tableRanges.push(range);
      }
    }
    const result =
      tableRanges.length === 0
        ? []
        : await this.model.snapshot(
            tableRanges,
            false,
            formatValue,
            consolidateRanges
          );

    const columns = IrisGridUtils.columnsFromRanges(consolidated, this.columns);

    if (includeHeaders) {
      const headerRow = columns.map(
        column => this.columnMap.get(column.name) ?? column.name
      );
      result.unshift(headerRow);
    }

    if (hasTotals) {
      const rowData = columns.map(column => {
        const index = this.getColumnIndexByName(column.name);
        assertNotNull(index);
        return index === 0
          ? GRAND_TOTAL_VALUE
          : formatValue(this.valueForCell(index, tableSize), column);
      });
      result.push(rowData);
    }

    return result;
  }

  colorForCell(x: ModelIndex, y: ModelIndex, theme: IrisGridThemeType): string {
    if (!isIrisGridTableModelTemplate(this.model)) {
      throw new Error('Invalid model, colorForCell not available');
    }

    if (this.schema.hasTotals && y === this.rowCount - 1) {
      if (x >= this.schema.rowColNames.length) {
        const value = this.valueForCell(x, y);
        if (value == null || value === '') {
          assertNotNull(theme.nullStringColor);
          return theme.nullStringColor;
        }

        // Format based on the value/type of the cell
        if (value != null) {
          const column = this.columns[x];
          if (TableUtils.isDateType(column.type) || column.name === 'Date') {
            assertNotNull(theme.dateColor);
            return theme.dateColor;
          }
          if (TableUtils.isNumberType(column.type)) {
            if ((value as number) > 0) {
              assertNotNull(theme.positiveNumberColor);
              return theme.positiveNumberColor;
            }
            if ((value as number) < 0) {
              assertNotNull(theme.negativeNumberColor);
              return theme.negativeNumberColor;
            }
            assertNotNull(theme.zeroNumberColor);
            return theme.zeroNumberColor;
          }
        }
      }

      return theme.textColor;
    }

    return this.model.colorForCell(x, y, theme);
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
    this.stopListeningToTotals();
    this.stopListeningToKeyTable();
    this.stopListeningToSchema();
    this.model.close();
  }
}

export default IrisGridSimplePivotModel;
