/* eslint-disable no-underscore-dangle */
/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import throttle from 'lodash.throttle';
import {
  type DeletableGridModel,
  type EditableGridModel,
  type EditOperation,
  GridRange,
  type GridRangeIndex,
  GridUtils,
  memoizeClear,
  type ModelIndex,
  type MoveOperation,
  type VisibleIndex,
} from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import {
  type CancelablePromise,
  EventShimCustomEvent,
  PromiseUtils,
  assertNotNull,
} from '@deephaven/utils';
import {
  TableUtils,
  Formatter,
  FormatterUtils,
  DateUtils,
} from '@deephaven/jsapi-utils';
import IrisGridModel, { type DisplayColumn } from './IrisGridModel';
import AggregationOperation from './sidebar/aggregations/AggregationOperation';
import IrisGridUtils from './IrisGridUtils';
import MissingKeyError from './MissingKeyError';
import {
  type ColumnName,
  type UITotalsTableConfig,
  type UIRow,
  type PendingDataMap,
  type CellData,
  type UIViewportData,
  type PendingDataErrorMap,
} from './CommonTypes';
import { type IrisGridThemeType } from './IrisGridTheme';
import type ColumnHeaderGroup from './ColumnHeaderGroup';
import { isColumnHeaderGroup } from './ColumnHeaderGroup';

const log = Log.module('IrisGridTableModelTemplate');

const SET_VIEWPORT_THROTTLE = 150;
const APPLY_VIEWPORT_THROTTLE = 0;

export function isIrisGridTableModelTemplate(
  model: IrisGridModel
): model is IrisGridTableModelTemplate {
  return (model as IrisGridTableModelTemplate).table !== undefined;
}

/**
 * Template model for a grid
 */

class IrisGridTableModelTemplate<
    T extends DhType.Table | DhType.TreeTable = DhType.Table,
    R extends UIRow = UIRow,
  >
  extends IrisGridModel
  implements DeletableGridModel, EditableGridModel
{
  static ROW_BUFFER_PAGES = 1;

  seekRow(
    startRow: number,
    column: DhType.Column,
    valueType: DhType.ValueTypeType,
    value: unknown,
    insensitive?: boolean | undefined,
    contains?: boolean | undefined,
    isBackwards?: boolean | undefined
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }

  export(): Promise<DhType.Table> {
    throw new Error('Method not implemented.');
  }

  columnStatistics(column: DhType.Column): Promise<DhType.ColumnStatistics> {
    throw new Error('Method not implemented.');
  }

  get customColumns(): ColumnName[] {
    return [];
  }

  set customColumns(customColumns: ColumnName[]) {
    throw new Error('Method not implemented.');
  }

  get formatColumns(): DhType.CustomColumn[] {
    return [];
  }

  set formatColumns(formatColumns: DhType.CustomColumn[]) {
    throw new Error('Method not implemented.');
  }

  updateFrozenColumns(columns: ColumnName[]): void {
    throw new Error('Method not implemented.');
  }

  get rollupConfig(): DhType.RollupConfig | null {
    throw new Error('Method not implemented.');
  }

  set rollupConfig(rollupConfig: DhType.RollupConfig | null) {
    throw new Error('Method not implemented.');
  }

  get selectDistinctColumns(): ColumnName[] {
    throw new Error('Method not implemented.');
  }

  set selectDistinctColumns(names: ColumnName[]) {
    throw new Error('Method not implemented.');
  }

  /**
   * Returns an array of the columns in the model
   * The order of model columns should never change once established
   */
  get columns(): DhType.Column[] {
    return this.table.columns;
  }

  dh: typeof DhType;

  irisGridUtils: IrisGridUtils;

  tableUtils: TableUtils;

  private irisFormatter: Formatter;

  private irisColumnAlignmentMap: Map<string, CanvasTextAlign>;

  inputTable: DhType.InputTable | null;

  private subscription: DhType.TableViewportSubscription | null;

  table: T;

  viewport: {
    top: VisibleIndex;
    bottom: VisibleIndex;
    columns?: DhType.Column[];
  } | null;

  viewportData: UIViewportData<R> | null;

  formattedStringData: (string | null)[][];

  private pendingStringData: (string | null)[][];

  private isSaveInProgress: boolean;

  private totalsTable: DhType.TotalsTable | null;

  totalsTablePromise: CancelablePromise<DhType.TotalsTable> | null;

  totals: UITotalsTableConfig | null;

  private totalsDataMap: Map<string, R> | null;

  // Map from new row index to their values. Only for input tables that can have new rows added.
  // The index of these rows start at 0, and they are appended at the end of the regular table data.
  // These rows can be sparse, so using a map instead of an array.
  private pendingNewDataMap: PendingDataMap<R>;

  private pendingNewRowCount = 0;

  private _columnHeaderGroupMap: Map<string, ColumnHeaderGroup> = new Map();

  private columnHeaderParentMap: Map<string, ColumnHeaderGroup> = new Map();

  private _columnHeaderMaxDepth: number | null = null;

  private _columnHeaderGroups: ColumnHeaderGroup[] = [];

  private _isColumnHeaderGroupsInitialized = false;

  private _movedColumns: MoveOperation[] | null = null;

  /**
   * @param dh JSAPI instance
   * @param table Iris data table to be used in the model
   * @param formatter The formatter to use when getting formats
   * @param inputTable Iris input table associated with this table
   * @param columnAlignmentMap Map of column alignments
   */
  constructor(
    dh: typeof DhType,
    table: T,
    formatter = new Formatter(dh),
    inputTable: DhType.InputTable | null = null,
    columnAlignmentMap = new Map<string, CanvasTextAlign>()
  ) {
    super(dh);

    this.handleTableDisconnect = this.handleTableDisconnect.bind(this);
    this.handleTableReconnect = this.handleTableReconnect.bind(this);
    this.handleTableUpdate = this.handleTableUpdate.bind(this);
    this.handleTotalsUpdate = this.handleTotalsUpdate.bind(this);
    this.handleRequestFailed = this.handleRequestFailed.bind(this);
    this.handleCustomColumnsChanged =
      this.handleCustomColumnsChanged.bind(this);

    this.dh = dh;
    this.irisFormatter = formatter;
    this.irisColumnAlignmentMap = columnAlignmentMap;
    this.irisGridUtils = new IrisGridUtils(dh);
    this.inputTable = inputTable;
    this.subscription = null;
    this.table = table;
    this.tableUtils = new TableUtils(dh);
    this.viewport = null;
    this.viewportData = null;
    this.formattedStringData = [];
    this.pendingStringData = [];
    this.isSaveInProgress = false;

    this.totalsTable = null;
    this.totalsTablePromise = null;
    this.totals = null;
    this.totalsDataMap = null;

    // Map from new row index to their values. Only for input tables that can have new rows added.
    // The index of these rows start at 0, and they are appended at the end of the regular table data.
    // These rows can be sparse, so using a map instead of an array.
    this.pendingNewDataMap = new Map();
    this.pendingNewRowCount = 0;
  }

  close(): void {
    this.table.close();
    if (this.totalsTable !== null) {
      this.totalsTable.close();
    }
    if (this.totalsTablePromise !== null) {
      this.totalsTablePromise.cancel();
    }
  }

  startListening(): void {
    super.startListening();

    const { dh } = this;

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

  stopListening(): void {
    super.stopListening();

    const { dh } = this;

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

  addTotalsListeners(totalsTable: DhType.TotalsTable): void {
    const { dh } = this;
    totalsTable.addEventListener(
      dh.Table.EVENT_UPDATED,
      this.handleTotalsUpdate
    );

    // Totals table only has one row of data
    totalsTable.setViewport(0, 0);
  }

  removeTotalsListeners(totalsTable: DhType.TotalsTable): void {
    const { dh } = this;
    totalsTable.removeEventListener(
      dh.Table.EVENT_UPDATED,
      this.handleTotalsUpdate
    );
  }

  handleTableDisconnect(): void {
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.DISCONNECT)
    );
  }

  handleTableReconnect(): void {
    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.RECONNECT));
  }

  handleTableUpdate(event: DhType.Event<DhType.ViewportData>): void {
    this.copyViewportData(event.detail);

    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  handleTotalsUpdate(event: DhType.Event<DhType.ViewportData>): void {
    this.copyTotalsData(event.detail);

    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  handleRequestFailed(event: DhType.Event<unknown>): void {
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, event)
    );
  }

  handleCustomColumnsChanged(): void {
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: this.columns,
      })
    );
  }

  get rowCount(): number {
    return (
      // Table size can be negative if the table isn't ready yet
      Math.max(this.table.size, 0) +
      this.pendingNewRowCount +
      (this.totals?.operationOrder?.length ?? 0)
    );
  }

  get pendingDataErrors(): PendingDataErrorMap {
    return this.getCachedPendingErrors(
      this.pendingNewDataMap,
      this.columns,
      this.inputTable?.keyColumns.length ?? 0
    );
  }

  get pendingDataMap(): PendingDataMap<R> {
    return this.pendingNewDataMap;
  }

  set pendingDataMap(map: PendingDataMap<R>) {
    if (map === this.pendingNewDataMap) {
      return;
    }

    map.forEach((row, rowIndex) => {
      if (!IrisGridUtils.isValidIndex(rowIndex)) {
        throw new Error(`Invalid rowIndex ${rowIndex}`);
      }

      const { data } = row;
      data.forEach((value, columnIndex) => {
        if (!IrisGridUtils.isValidIndex(columnIndex)) {
          throw new Error(`Invalid columnIndex ${columnIndex}`);
        }
      });
    });

    this.pendingNewDataMap = map;

    this.pendingNewRowCount = Math.max(
      this.pendingNewRowCount,
      this.maxPendingDataRow
    );

    this.formattedStringData = [];

    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.PENDING_DATA_UPDATED)
    );
  }

  get pendingRowCount(): number {
    return this.pendingNewRowCount;
  }

  set pendingRowCount(count: number) {
    if (count === this.pendingNewRowCount) {
      return;
    }

    this.pendingNewRowCount = Math.max(0, count, this.maxPendingDataRow);

    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  get maxPendingDataRow(): number {
    return this.pendingNewDataMap.size > 0
      ? Math.max(...this.pendingNewDataMap.keys()) + 1
      : 0;
  }

  get columnCount(): number {
    return this.columns.length;
  }

  get floatingBottomRowCount(): number {
    return this.totals != null && this.totals.showOnTop
      ? 0
      : this.totals?.operationOrder?.length ?? 0;
  }

  get floatingTopRowCount(): number {
    return this.totals != null && this.totals.showOnTop
      ? this.totals?.operationOrder?.length ?? 0
      : 0;
  }

  get isValuesTableAvailable(): boolean {
    return this.table.selectDistinct != null && this.table.copy != null;
  }

  get isChartBuilderAvailable(): boolean {
    return true;
  }

  get isOrganizeColumnsAvailable(): boolean {
    return true;
  }

  get isTotalsAvailable(): boolean {
    return this.table.getTotalsTable != null;
  }

  get isEditable(): boolean {
    return !this.isSaveInProgress && this.inputTable != null;
  }

  get isDeletable(): boolean {
    return this.keyColumnSet.size > 0;
  }

  get isViewportPending(): boolean {
    if (
      this.viewport == null ||
      this.viewport.columns === undefined ||
      this.viewportData == null
    ) {
      return true;
    }
    // no columns or no rows
    if (
      this.viewport.columns.length === 0 ||
      this.viewportData.rows.length === 0
    ) {
      return false;
    }

    // offset is first row of loaded data
    const pendingTop = this.viewport.top < this.viewportData.offset;
    // offset + row.length is last row of loaded data
    const pendingBottom =
      this.viewportData.offset + this.viewportData.rows.length <
      this.viewport.bottom;
    // left column doesn't exist in data
    const pendingLeft =
      this.viewportData.rows[0].data.get(this.viewport.columns[0].index) ===
      undefined;
    // right column doesn't exist in data
    const pendingRight =
      this.viewportData.rows[0].data.get(
        this.viewport.columns[this.viewport.columns.length - 1].index
      ) === undefined;

    return pendingTop || pendingBottom || pendingLeft || pendingRight;
  }

  cacheFormattedValue(x: ModelIndex, y: ModelIndex, text: string | null): void {
    if (this.formattedStringData[x] == null) {
      this.formattedStringData[x] = [];
    }
    this.formattedStringData[x][y] = text;
  }

  cachePendingValue(x: ModelIndex, y: ModelIndex, text: string | null): void {
    if (this.pendingStringData[x] == null) {
      this.pendingStringData[x] = [];
    }
    this.pendingStringData[x][y] = text;
  }

  clearPendingValue(x: ModelIndex, y: ModelIndex): void {
    const column = this.pendingStringData[x];
    if (column != null) {
      delete column[y];
    }
  }

  textValueForCell(x: ModelIndex, y: ModelIndex): string | null | undefined {
    // First check if there's any pending values we should read from
    if (this.pendingStringData[x]?.[y] !== undefined) {
      return this.pendingStringData[x][y];
    }

    // Use a separate cache from memoization just for the strings that are currently displayed
    if (this.formattedStringData[x]?.[y] === undefined) {
      const value = this.valueForCell(x, y);
      if (value === null) {
        return null;
      }
      if (value === undefined) {
        return undefined;
      }

      const column = this.sourceColumn(x, y);
      const hasCustomColumnFormat = this.getCachedCustomColumnFormatFlag(
        this.formatter,
        column.name,
        column.type
      );
      let formatOverride;
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

  textForCell(x: ModelIndex, y: ModelIndex): string {
    const text = this.textValueForCell(x, y);
    if (text == null && this.isKeyColumn(x)) {
      const pendingRow = this.pendingRow(y);
      if (pendingRow != null && this.pendingDataMap.has(pendingRow)) {
        // Asterisk to show a value is required for a key column on a row that has some data entered
        return '*';
      }
    }

    if (TableUtils.isTextType(this.columns[x]?.type)) {
      if (text === null) {
        return this.formatter.showNullStrings ? 'null' : '';
      }

      if (text === '') {
        return this.formatter.showEmptyStrings ? 'empty' : '';
      }
    }

    return text ?? '';
  }

  truncationCharForCell(x: ModelIndex): '#' | undefined {
    const column = this.columns[x];
    const { type } = column;
    if (
      TableUtils.isNumberType(type) &&
      this.formatter.truncateNumbersWithPound
    ) {
      return '#';
    }

    return undefined;
  }

  colorForCell(x: ModelIndex, y: ModelIndex, theme: IrisGridThemeType): string {
    const data = this.dataForCell(x, y);
    if (data) {
      const { format, value } = data;
      if (value == null || value === '') {
        assertNotNull(theme.nullStringColor);
        return theme.nullStringColor;
      }
      if (format?.color != null && format.color !== '') {
        return format.color;
      }

      if (this.isPendingRow(y)) {
        // Data entered in a pending row
        assertNotNull(theme.pendingTextColor);
        return theme.pendingTextColor;
      }

      // Fallback to formatting based on the value/type of the cell
      if (value != null) {
        const column = this.sourceColumn(x, y);
        return IrisGridUtils.colorForValue(
          theme,
          column.type,
          column.name,
          value
        );
      }
    } else if (this.isPendingRow(y) && this.isKeyColumn(x)) {
      assertNotNull(theme.errorTextColor);
      return theme.errorTextColor;
    }

    return theme.textColor;
  }

  backgroundColorForCell(
    x: ModelIndex,
    y: ModelIndex,
    theme: IrisGridThemeType
  ): string | null {
    return this.formatForCell(x, y)?.backgroundColor ?? null;
  }

  textAlignForCell(x: ModelIndex, y: ModelIndex): CanvasTextAlign {
    const column = this.sourceColumn(x, y);

    const userTextAlignment = this.columnAlignmentMap.get(column.name);
    if (userTextAlignment != null) {
      return userTextAlignment;
    }

    return IrisGridUtils.textAlignForValue(column.type, column.name);
  }

  textForColumnHeader(x: ModelIndex, depth = 0): string | undefined {
    const header = this.columnAtDepth(x, depth);
    if (isColumnHeaderGroup(header)) {
      return header.isNew ? '' : header.name;
    }
    return header?.displayName ?? header?.name;
  }

  colorForColumnHeader(x: ModelIndex, depth = 0): string | null {
    const column = this.columnAtDepth(x, depth);
    if (isColumnHeaderGroup(column)) {
      return column.color ?? null;
    }
    return null;
  }

  tooltipForCell(column: GridRangeIndex, row: GridRangeIndex): string | null {
    if (column === null || row === null) return null;
    if (TableUtils.isDateType(this.columns[column].type)) {
      return this.displayString(
        this.valueForCell(column, row),
        this.columns[column].type,
        this.columns[column].name,
        { formatString: DateUtils.FULL_DATE_FORMAT }
      );
    }
    return null;
  }

  getColumnHeaderGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ColumnHeaderGroup | undefined {
    const group = this.columnAtDepth(modelIndex, depth);
    if (isColumnHeaderGroup(group)) {
      return group;
    }
    return undefined;
  }

  getColumnHeaderParentGroup(
    modelIndex: ModelIndex,
    depth: number
  ): ColumnHeaderGroup | undefined {
    return this.columnHeaderParentMap.get(
      this.columnAtDepth(modelIndex, depth)?.name ?? ''
    );
  }

  columnAtDepth(
    x: ModelIndex,
    depth = 0
  ): ColumnHeaderGroup | DisplayColumn | undefined {
    if (depth === 0) {
      return this.columns[x];
    }

    const columnName = this.columns[x]?.name;
    let group = this.columnHeaderParentMap.get(columnName);

    if (!group) {
      return undefined;
    }

    let currentDepth = group.depth;
    while (currentDepth < depth) {
      group = this.columnHeaderParentMap.get(group.name);
      if (!group) {
        return undefined;
      }
      currentDepth = group.depth;
    }

    if (group.depth === depth) {
      return group;
    }

    return undefined;
  }

  textForRowFooter(y: ModelIndex): string {
    const totalsRow = this.totalsRow(y);
    if (totalsRow != null && this.totals) {
      return this.totals.operationOrder[totalsRow];
    }
    return '';
  }

  private getMemoizedInitialMovedColumns = memoize(
    (layoutHints?: DhType.LayoutHints): readonly MoveOperation[] => {
      if (!layoutHints) {
        return [];
      }
      let movedColumns: MoveOperation[] = [];
      const { groupMap } = IrisGridUtils.parseColumnHeaderGroups(
        this,
        layoutHints?.columnGroups ?? []
      );

      const moveColumn = (name: string, toIndex: VisibleIndex): void => {
        const modelIndex = this.getColumnIndexByName(name);
        if (modelIndex == null) {
          throw new Error(`Unknown layout hint column: ${name}`);
        }
        const visibleIndex = GridUtils.getVisibleIndex(
          modelIndex,
          movedColumns
        );
        movedColumns = GridUtils.moveItem(visibleIndex, toIndex, movedColumns);
      };

      const moveGroup = (name: string, toIndex: VisibleIndex): void => {
        const group = groupMap.get(name);
        if (group == null) {
          throw new Error(`Unknown layout hint group: ${name}`);
        }
        const visibleRange = group.getVisibleRange(movedColumns);
        movedColumns = GridUtils.moveRange(visibleRange, toIndex, movedColumns);
      };

      const frontColumns = layoutHints.frontColumns ?? [];
      const backColumns = layoutHints.backColumns ?? [];
      const frozenColumns = layoutHints.frozenColumns ?? [];

      if (
        frontColumns.length > 0 ||
        backColumns.length > 0 ||
        frozenColumns.length > 0
      ) {
        const usedColumns = new Set();

        let frontIndex = 0;
        frozenColumns?.forEach(name => {
          if (usedColumns.has(name)) {
            throw new Error(
              `Column specified in multiple layout hints: ${name}`
            );
          }
          moveColumn(name, frontIndex);
          frontIndex += 1;
        });
        frontColumns.forEach(name => {
          if (usedColumns.has(name)) {
            throw new Error(
              `Column specified in multiple layout hints: ${name}`
            );
          }
          moveColumn(name, frontIndex);
          frontIndex += 1;
        });

        let backIndex = this.columns.length - 1;
        backColumns?.forEach(name => {
          if (usedColumns.has(name)) {
            throw new Error(
              `Column specified in multiple layout hints: ${name}`
            );
          }
          moveColumn(name, backIndex);
          backIndex -= 1;
        });
      }

      const layoutHintColumnGroups = layoutHints?.columnGroups;
      if (layoutHintColumnGroups) {
        const columnGroups = [...groupMap.values()];
        columnGroups.sort((a, b) => a.depth - b.depth);

        columnGroups.forEach(group => {
          const firstChildName = group.children[0];
          const rightModelIndex = this.getColumnIndexByName(firstChildName);

          let rightVisibleIndex: number;

          if (rightModelIndex != null) {
            rightVisibleIndex = GridUtils.getVisibleIndex(
              rightModelIndex,
              movedColumns
            );
          } else {
            const firstChildGroup = groupMap.get(firstChildName);
            if (!firstChildGroup) {
              throw new Error(
                `Unknown column ${firstChildName} in group ${group.name}`
              );
            }

            const visibleRange = firstChildGroup.getVisibleRange(movedColumns);
            // Columns will be moved to start at the end of the first child group
            [, rightVisibleIndex] = visibleRange;
          }

          for (let i = 1; i < group.children.length; i += 1) {
            const childName = group.children[i];
            const childGroup = groupMap.get(childName);
            const childColumn = this.getColumnIndexByName(childName);

            if (childGroup) {
              // All columns in the group will be before or after the start index
              // Lower level groups are re-arranged first, so they will be contiguous
              const isBeforeGroup =
                childGroup.getVisibleRange(movedColumns)[0] < rightVisibleIndex;

              const moveToIndex = isBeforeGroup
                ? rightVisibleIndex - childGroup.childIndexes.length + 1
                : rightVisibleIndex + 1;

              moveGroup(childName, moveToIndex);
              rightVisibleIndex =
                moveToIndex + childGroup.childIndexes.length - 1;
            } else if (childColumn != null) {
              const isBeforeGroup =
                GridUtils.getVisibleIndex(childColumn, movedColumns) <
                rightVisibleIndex;

              const moveToIndex = isBeforeGroup
                ? rightVisibleIndex
                : rightVisibleIndex + 1;
              moveColumn(childName, moveToIndex);
              rightVisibleIndex = moveToIndex;
            }
          }
        });
      }

      this._movedColumns = movedColumns;
      return movedColumns;
    }
  );

  /**
   * Used to get the initial moved columns based on layout hints
   */
  get initialMovedColumns(): readonly MoveOperation[] {
    return this.getMemoizedInitialMovedColumns(this.layoutHints ?? undefined);
  }

  getMemoizedInitialColumnHeaderGroups = memoize(
    (layoutHints?: DhType.LayoutHints) =>
      IrisGridUtils.parseColumnHeaderGroups(
        this,
        layoutHints?.columnGroups ?? []
      ).groups
  );

  get initialColumnHeaderGroups(): ColumnHeaderGroup[] {
    return this.getMemoizedInitialColumnHeaderGroups(
      this.layoutHints ?? undefined
    );
  }

  get columnHeaderMaxDepth(): number {
    return this._columnHeaderMaxDepth ?? 1;
  }

  private set columnHeaderMaxDepth(depth: number) {
    this._columnHeaderMaxDepth = depth;
  }

  get columnHeaderGroupMap(): Map<string, ColumnHeaderGroup> {
    this.initializeColumnHeaderGroups();
    return this._columnHeaderGroupMap;
  }

  get columnHeaderGroups(): ColumnHeaderGroup[] {
    this.initializeColumnHeaderGroups();
    return this._columnHeaderGroups;
  }

  set columnHeaderGroups(groups: ColumnHeaderGroup[]) {
    if (groups === this._columnHeaderGroups) {
      return;
    }

    const {
      groups: newGroups,
      maxDepth,
      parentMap,
      groupMap,
    } = IrisGridUtils.parseColumnHeaderGroups(
      this,
      groups ?? this.initialColumnHeaderGroups
    );

    this._columnHeaderGroups = newGroups;
    this.columnHeaderMaxDepth = maxDepth;
    this.columnHeaderParentMap = parentMap;
    this._columnHeaderGroupMap = groupMap;
    this._isColumnHeaderGroupsInitialized = true;
  }

  private initializeColumnHeaderGroups(): void {
    if (!this._isColumnHeaderGroupsInitialized) {
      this.columnHeaderGroups = IrisGridUtils.parseColumnHeaderGroups(
        this,
        this.layoutHints?.columnGroups ?? []
      ).groups;
    }
  }

  row(y: ModelIndex): R | null {
    const totalsRowCount = this.totals?.operationOrder?.length ?? 0;
    const showOnTop = this.totals?.showOnTop ?? false;
    const totalsRow = this.totalsRow(y);
    if (totalsRow != null) {
      const operation = this.totals?.operationOrder[totalsRow];
      assertNotNull(operation);
      return this.totalsDataMap?.get(operation) ?? null;
    }
    const pendingRow = this.pendingRow(y);
    if (pendingRow != null) {
      return this.pendingNewDataMap.get(pendingRow) ?? null;
    }
    const offset = this.viewportData?.offset ?? 0;
    const viewportY = (showOnTop ? y - totalsRowCount : y) - offset;
    return this.viewportData?.rows?.[viewportY] ?? null;
  }

  /**
   * Retrieve the source column for given coordinates.
   * - Retrieve the totals column if this is a totals row
   * - Retrieve the source column if it's a proxied column
   * - Otherwise return the column at the given index
   * @param column Column index to get the source column from
   * @param row Row index to get the source column from
   */
  sourceColumn(column: ModelIndex, row: ModelIndex): DhType.Column {
    const totalsRow = this.totalsRow(row);
    if (totalsRow != null) {
      const operation = this.totals?.operationOrder[totalsRow];
      const defaultOperation =
        this.totals?.defaultOperation ?? AggregationOperation.SUM;
      const tableColumn = this.columns[column];

      // Find the matching totals table column for the operation
      // When there are multiple aggregations for the column, the column name will be the original name of the column with the operation appended afterward
      // When the the operation is the default operation OR there is only one operation for the column, then the totals column name is just the original column name
      const totalsColumn = this.totalsTable?.columns.find(
        col =>
          col.name === `${tableColumn.name}__${operation}` ||
          ((operation === defaultOperation ||
            this.totals?.operationMap[col.name]?.length === 1) &&
            col.name === tableColumn.name)
      );
      if (totalsColumn != null) {
        return totalsColumn;
      }
      // There may be cases were the totals table doesn't have a column, such as when there's a virtual column
    }
    return this.columns[column];
  }

  /**
   * Translate from the row in the model to a row in the totals table.
   * If the row is not a totals row, return null
   * @param y The row in the model to get the totals row for
   * @returns The row within the totals table if it's a totals row, null otherwise
   */
  totalsRow(y: ModelIndex): ModelIndex | null {
    const totalsRowCount = this.totals?.operationOrder?.length ?? 0;
    const showOnTop = this.totals?.showOnTop ?? false;
    const totalsRow = showOnTop ? y : y - this.table.size;
    if (totalsRow >= 0 && totalsRow < totalsRowCount) {
      return totalsRow;
    }
    return null;
  }

  /**
   * Translate from the row in the model to a pending input row.
   * If the row is not a pending input row, return null
   * @param y The row in the model to get the pending row for
   * @returns The row within the pending input rows if it's a pending row, null otherwise
   */
  pendingRow(y: ModelIndex): ModelIndex | null {
    if (!this.isEditable) {
      return null;
    }

    const pendingRow = y - this.floatingTopRowCount - this.table.size;

    if (pendingRow >= 0) {
      return pendingRow;
    }

    return null;
  }

  /**
   * Check if a row is a totals table row
   * @param y The row in the model to check if it's a totals table row
   * @returns True if the row is a totals row, false if not
   */
  isTotalsRow(y: ModelIndex): boolean {
    return this.totalsRow(y) != null;
  }

  /**
   * Check if a row is a pending input row
   * @param y The row in the model to check if it's a pending new row
   * @returns True if the row is a pending new row, false if not
   */
  isPendingRow(y: ModelIndex): boolean {
    return this.pendingRow(y) != null;
  }

  dataForCell(x: ModelIndex, y: ModelIndex): CellData | undefined {
    return this.row(y)?.data.get(x);
  }

  formatForCell(x: ModelIndex, y: ModelIndex): DhType.Format | undefined {
    return this.dataForCell(x, y)?.format;
  }

  valueForCell(x: ModelIndex, y: ModelIndex): unknown {
    const data = this.dataForCell(x, y);

    /* JS API current sets null values as undefined in some instances. This means 
    we need to nullish coaelesce so all undefined values from the API return null 
    since the data has been fetched. undefined is used to indicate the API has not 
    fetched data yet */
    if (data) {
      return data.value ?? null;
    }
    return undefined;
  }

  copyViewportData(data: DhType.ViewportData): void {
    if (data == null) {
      log.warn('invalid data!');
      return;
    }

    this.viewportData = this.extractViewportData(data);
    this.formattedStringData = [];
  }

  copyTotalsData(totalsData: DhType.ViewportData): void {
    if (totalsData == null) {
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
      const [name, operation = operationMap?.[name]?.[0] ?? defaultOperation] =
        column.name.split('__');
      if (!dataMap.has(operation)) {
        dataMap.set(operation, { data: new Map() });
      }
      const { data: rowData } = dataMap.get(operation);
      const columnIndex = this.columns.findIndex(col => col.name === name);
      rowData.set(columnIndex, {
        value: row.get(column),
        format: row.getFormat(column),
      });
    }

    log.debug2('copyTotalsData', dataMap);

    this.totalsDataMap = dataMap;
    this.formattedStringData = [];
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

  /**
   * Copies all the viewport data into an object that we can reference later.
   * @param data The data to copy from
   */
  extractViewportData(data: DhType.ViewportData): UIViewportData<R> {
    const newData: UIViewportData<R> = {
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

  extractViewportRow(row: DhType.Row, columns: DhType.Column[]): R {
    const data = new Map<ModelIndex | ColumnName, CellData>();
    for (let c = 0; c < columns.length; c += 1) {
      const column = columns[c];

      const index = this.getColumnIndexByName(column.name);
      data.set(index ?? column.name, {
        value: row.get(column),
        format: row.getFormat(column),
      });
    }

    return { data } as R;
  }

  closeSubscription(): void {
    log.debug2('closeSubscription', this.subscription);
    if (this.subscription) {
      this.subscription.close();
      this.subscription = null;
    }

    this.setViewport.cancel();
    this.applyViewport.cancel();
  }

  get filter(): DhType.FilterCondition[] {
    return this.table.filter;
  }

  set filter(filter: DhType.FilterCondition[]) {
    this.closeSubscription();
    this.table.applyFilter(filter);
    this.applyViewport();
  }

  get formatter(): Formatter {
    return this.irisFormatter;
  }

  set formatter(formatter: Formatter) {
    this.irisFormatter = formatter;
    this.formattedStringData = [];
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.FORMATTER_UPDATED)
    );
  }

  get columnAlignmentMap(): ReadonlyMap<string, CanvasTextAlign> {
    return this.irisColumnAlignmentMap;
  }

  set columnAlignmentMap(columnAlignmentMap: Map<string, CanvasTextAlign>) {
    this.irisColumnAlignmentMap = columnAlignmentMap;
  }

  displayString(
    value: unknown,
    columnType: string,
    columnName = '',
    formatOverride?: { formatString?: string | null }
  ): string {
    return this.getCachedFormattedString(
      this.formatter,
      value,
      columnType,
      columnName,
      formatOverride
    );
  }

  get sort(): DhType.Sort[] {
    return this.table.sort;
  }

  set sort(sort: DhType.Sort[]) {
    this.closeSubscription();
    this.table.applySort(sort);
    this.applyViewport();
  }

  set totalsConfig(totalsConfig: UITotalsTableConfig | null) {
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
      this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
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
          new EventShimCustomEvent(IrisGridModel.EVENT.REQUEST_FAILED, {
            detail: err,
          })
        );
      });
  }

  setTotalsTable(totalsTable: DhType.TotalsTable | null): void {
    log.debug('setTotalsTable', totalsTable);

    if (this.totalsTable !== null) {
      if (this.listenerCount > 0) {
        this.removeTotalsListeners(this.totalsTable);
      }

      this.totalsTable.close();
    }

    this.totalsTable = totalsTable;
    this.totalsDataMap = null;

    if (this.listenerCount > 0 && this.totalsTable != null) {
      this.addTotalsListeners(this.totalsTable);
    }
  }

  setViewport = throttle(
    (top: VisibleIndex, bottom: VisibleIndex, columns?: DhType.Column[]) => {
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
    },
    SET_VIEWPORT_THROTTLE
  );

  /**
   * Applies the current viewport to the underlying table.
   */
  applyViewport = throttle(
    (): void => {
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
    },
    APPLY_VIEWPORT_THROTTLE,
    { leading: false }
  );

  applyBufferedViewport(
    viewportTop: number,
    viewportBottom: number,
    columns?: DhType.Column[]
  ): void {
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.VIEWPORT_UPDATED)
    );
    log.debug2('applyBufferedViewport', viewportTop, viewportBottom, columns);
    if (this.subscription == null) {
      log.debug2('applyBufferedViewport creating new subscription');
      this.subscription =
        this.table.setViewport(viewportTop, viewportBottom, columns) ?? null;
    } else {
      log.debug2('applyBufferedViewport using existing subscription');
      this.subscription.setViewport(viewportTop, viewportBottom, columns);
    }
  }

  async snapshot(
    ranges: readonly GridRange[],
    includeHeaders = false,
    formatValue: (value: unknown, column: DhType.Column) => unknown = value =>
      value,
    consolidateRanges = true
  ): Promise<unknown[][]> {
    if (this.subscription == null) {
      throw new Error('No subscription available');
    }

    const consolidated = consolidateRanges
      ? GridRange.consolidate(ranges)
      : ranges;
    if (!IrisGridUtils.isValidSnapshotRanges(consolidated)) {
      throw new Error(`Invalid snapshot ranges ${ranges}`);
    }

    // Need to separate out the floating ranges as they're from a different source
    const topFloatingRowsSet = new Set<number>();
    const tableRanges: GridRange[] = [];
    const bottomFloatingRowsSet = new Set<number>();
    for (let i = 0; i < consolidated.length; i += 1) {
      const range = consolidated[i];
      assertNotNull(range.endRow);
      assertNotNull(range.startRow);
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
      const rowData = columns.map(column => {
        const index = this.getColumnIndexByName(column.name);
        assertNotNull(index);
        return formatValue(this.valueForCell(index, row), column);
      });
      if (includeHeaders) {
        rowData.push(this.textForRowFooter(row));
      }
      result.push(rowData);
    }

    if (tableRanges.length > 0) {
      const rangeSet = this.irisGridUtils.rangeSetFromRanges(tableRanges);
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
      const rowData = columns.map(column => {
        const index = this.getColumnIndexByName(column.name);
        assertNotNull(index);
        return formatValue(this.valueForCell(index, row), column);
      });
      if (includeHeaders) {
        rowData.push(this.textForRowFooter(row));
      }
      result.push(rowData);
    }

    return result;
  }

  /**
   * Get a text snapshot of the provided ranges
   * @param ranges The ranges to get the snapshot for
   * @param includeHeaders Whether to include the headers in the snapshot or not
   * @param formatValue Function for formatting the raw value into a string
   * @returns A formatted string of all the data, columns separated by `\t` and rows separated by `\n`
   */
  async textSnapshot(
    ranges: readonly GridRange[],
    includeHeaders = false,
    formatValue: (
      value: unknown,
      column: DhType.Column,
      row?: DhType.Row
    ) => string = value => `${value}`
  ): Promise<string> {
    log.debug2('textSnapshot', ranges, includeHeaders);

    const data = await this.snapshot(
      ranges,
      includeHeaders,
      formatValue,
      false
    );
    return data.map(row => row.join('\t')).join('\n');
  }

  async valuesTable(
    columns: DhType.Column | readonly DhType.Column[]
  ): Promise<DhType.Table> {
    let table = null;
    try {
      table = await this.table.copy();
      table.applyFilter([]);
      table.applySort([]);
      return await table.selectDistinct(
        Array.isArray(columns) ? columns : [columns]
      );
    } finally {
      if (table != null) {
        table.close();
      }
    }
  }

  getCachedFormattedString = memoizeClear(
    (
      formatter: Formatter,
      value: unknown,
      columnType: string,
      columnName: ColumnName,
      formatOverride?: { formatString?: string | null }
    ): string =>
      formatter.getFormattedString(
        value,
        columnType,
        columnName,
        formatOverride
      ),
    { max: 10000 }
  );

  getCachedCustomColumnFormatFlag = memoizeClear(
    FormatterUtils.isCustomColumnFormatDefined,
    { max: 10000 }
  );

  getCachedViewportRowRange = memoize(
    (top: number, bottom: number): [number, number] => {
      const viewHeight = bottom - top;
      const viewportTop = Math.max(
        0,
        top - viewHeight * IrisGridTableModelTemplate.ROW_BUFFER_PAGES
      );
      const viewportBottom =
        bottom + viewHeight * IrisGridTableModelTemplate.ROW_BUFFER_PAGES;
      return [viewportTop, viewportBottom];
    }
  );

  getCachedPendingErrors = memoize(
    (
      pendingDataMap: PendingDataMap,
      columns: DhType.Column[],
      keyColumnCount: number
    ) => {
      const map = new Map<ModelIndex, MissingKeyError[]>();
      pendingDataMap.forEach((row, rowIndex) => {
        const { data: rowData } = row;
        for (let i = 0; i < keyColumnCount; i += 1) {
          if (!rowData.has(i)) {
            if (!map.has(rowIndex)) {
              map.set(rowIndex, []);
            }
            map
              .get(rowIndex)
              ?.push(new MissingKeyError(rowIndex, columns[i].name));
          }
        }
      });
      return map;
    }
  );

  isColumnMovable(modelIndex: ModelIndex, depth: number): boolean {
    if (modelIndex < 0 || modelIndex >= this.columnCount) {
      return false;
    }

    // All groups are movable
    if (depth > 0) {
      return true;
    }

    const columnName = this.columns[modelIndex].name;
    if (
      this.frontColumns.includes(columnName) ||
      this.backColumns.includes(columnName) ||
      this.frozenColumns.includes(columnName) ||
      !columnName
    ) {
      return false;
    }
    return !this.isKeyColumn(modelIndex);
  }

  isColumnSortable(modelIndex: ModelIndex): boolean {
    return this.columns[modelIndex].isSortable ?? true;
  }

  isKeyColumn(x: ModelIndex): boolean {
    return this.keyColumnSet.has(this.columns[x].name);
  }

  isRowMovable(): boolean {
    return false;
  }

  isEditableRange(range: GridRange): boolean {
    // Make sure we have an input table and a valid range
    if (
      this.inputTable == null ||
      range.startRow == null ||
      range.endRow == null
    ) {
      return false;
    }

    // Check that the edit is in the editable range
    // If an input table has keyed columns, the non-key columns are always editable
    // If an input table does not have key columns, it is append only and existing rows cannot be editable
    // Pending rows are always editable
    const isPendingRange =
      this.isPendingRow(range.startRow) && this.isPendingRow(range.endRow);

    let isKeyColumnInRange = false;
    assertNotNull(range.startColumn);
    // Check if any of the columns in grid range are key columns
    const bound = range.endColumn ?? this.table.size;
    for (let column = range.startColumn; column <= bound; column += 1) {
      if (this.isKeyColumn(column)) {
        isKeyColumnInRange = true;
        break;
      }
    }

    if (
      !(isPendingRange || (this.keyColumnSet.size !== 0 && !isKeyColumnInRange))
    ) {
      return false;
    }

    return true;
  }

  isDeletableRange(range: GridRange): boolean {
    return (
      this.inputTable != null &&
      range.startRow != null &&
      range.endRow != null &&
      range.startRow >= this.floatingTopRowCount &&
      range.startRow <
        this.floatingTopRowCount + this.table.size + this.pendingRowCount &&
      range.endRow <
        this.floatingTopRowCount + this.table.size + this.pendingRowCount
    );
  }

  isEditableRanges(ranges: GridRange[]): boolean {
    return ranges.every(range => this.isEditableRange(range));
  }

  isDeletableRanges(ranges: readonly GridRange[]): boolean {
    return ranges.every(range => this.isDeletableRange(range));
  }

  /**
   * @returns A range corresponding to the underlying table
   */
  getTableAreaRange(): GridRange {
    return new GridRange(
      null,
      this.floatingTopRowCount,
      null,
      this.floatingTopRowCount + this.table.size - 1
    );
  }

  /**
   * @returns A range corresponding to the pending new rows
   */
  getPendingAreaRange(): GridRange {
    return new GridRange(
      null,
      this.floatingTopRowCount + this.table.size,
      null,
      this.floatingTopRowCount + this.table.size + this.pendingNewRowCount - 1
    );
  }

  /**
   * Set value in an editable table
   * @param x The column to set
   * @param y The row to set
   * @param value The value to set
   * @returns A promise that resolves successfully when the operation is complete, or rejects if there's an error
   */
  async setValueForCell(
    x: ModelIndex,
    y: ModelIndex,
    text: string
  ): Promise<void> {
    // Cache the value in our pending string cache so that it stays displayed until our edit has been completed
    return this.setValueForRanges([new GridRange(x, y, x, y)], text);
  }

  /**
   * Set value in an editable table
   * @param ranges The ranges to set
   * @param value The values to set
   * @returns A promise that resolves successfully when the operation is complete, or rejects if there's an error
   */
  async setValueForRanges(
    ranges: readonly GridRange[],
    text: string
  ): Promise<void> {
    if (!this.isEditableRanges(ranges as GridRange[])) {
      throw new Error(`Uneditable ranges ${ranges}`);
    }

    try {
      // Cache the value in our pending string cache so that it stays displayed until our edit has been completed
      const columnSet = new Set<DhType.Column>();

      // Formatted text for each column
      // Since there could be different formatting for each column, but the value will be the same across rows
      const formattedText: (string | null)[] = [];
      GridRange.forEachCell(ranges, (x, y) => {
        const column = this.columns[x];
        columnSet.add(column);
        if (formattedText[x] === undefined) {
          const value = this.tableUtils.makeValue(
            column.type,
            text,
            this.formatter.timeZone
          );
          formattedText[x] =
            value != null
              ? this.displayString(value, column.type, column.name)
              : null;
        }
        this.cachePendingValue(x, y, formattedText[x]);
      });

      // Take care of updates to the pending new area first, as they can be updated synchronously
      const pendingAreaRange = this.getPendingAreaRange();
      const pendingRanges = ranges
        .map(range => GridRange.intersection(pendingAreaRange, range))
        .filter(range => range != null)
        .map(range => {
          assertNotNull(range);
          return GridRange.offset(
            range,
            0,
            -(this.floatingTopRowCount + this.table.size)
          );
        });
      if (pendingRanges.length > 0) {
        const newDataMap = new Map(this.pendingNewDataMap);
        GridRange.forEachCell(pendingRanges, (columnIndex, rowIndex) => {
          if (!newDataMap.has(rowIndex)) {
            newDataMap.set(rowIndex, { data: new Map() } as R);
          }
          const column = this.columns[columnIndex];
          const row = newDataMap.get(rowIndex);
          assertNotNull(row);
          const { data: rowData } = row;
          const newRowData = new Map(rowData);
          const value = this.tableUtils.makeValue(
            column.type,
            text,
            this.formatter.timeZone
          );
          if (value != null) {
            newRowData.set(columnIndex, { value });
          } else {
            newRowData.delete(columnIndex);
          }
          if (newRowData.size > 0) {
            newDataMap.set(rowIndex, { ...row, data: newRowData });
          } else {
            newDataMap.delete(rowIndex);
          }
        });
        this.pendingDataMap = newDataMap;
      }

      this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));

      const tableAreaRange = this.getTableAreaRange();
      const tableRanges = ranges
        .map(range => GridRange.intersection(tableAreaRange, range))
        .filter(range => range != null);
      if (tableRanges.length > 0) {
        // Get a snapshot of the full rows, as we need to write a full row when editing
        const data = await this.snapshot(
          tableRanges.map(
            range =>
              new GridRange(
                null,
                range?.startRow ?? null,
                null,
                range?.endRow ?? null
              )
          )
        );
        const newRows = data.map(row => {
          const newRow: Record<ColumnName, unknown> = {};
          for (let c = 0; c < this.columns.length; c += 1) {
            newRow[this.columns[c].name] = row[c];
          }

          columnSet.forEach(column => {
            newRow[column.name] = this.tableUtils.makeValue(
              column.type,
              text,
              this.formatter.timeZone
            );
          });
          return newRow;
        });

        const result = await this.inputTable?.addRows(newRows);

        log.debug(
          'setValueForRanges(',
          ranges,
          ',',
          text,
          ') set tableRanges',
          tableRanges,
          'result',
          result
        );
      }

      // Add the changes to the formatted cache so it's still displayed until the update event is received
      // The update event could be received on the next tick, after the input rows have been committed,
      // so make sure we don't display stale data
      GridRange.forEachCell(ranges, (x, y) => {
        const cellText = formattedText[x];
        assertNotNull(cellText);
        this.cacheFormattedValue(x, y, cellText);
      });
    } catch (err) {
      log.error('Unable to set ranges', ranges, text, err);
    } finally {
      GridRange.forEachCell(ranges, (x, y) => {
        this.clearPendingValue(x, y);
      });
    }
  }

  async setValues(edits: readonly EditOperation[] = []): Promise<void> {
    log.debug('setValues(', edits, ')');
    if (
      !edits.every(edit =>
        this.isEditableRange(
          GridRange.makeCell(edit.column ?? edit.x, edit.row ?? edit.y)
        )
      )
    ) {
      throw new Error(`Uneditable ranges ${edits}`);
    }

    try {
      const newDataMap = new Map(this.pendingNewDataMap);

      // Cache the display values
      edits.forEach(edit => {
        const { text } = edit;
        const x = edit.column ?? edit.x;
        const y = edit.row ?? edit.y;
        const column = this.columns[x];
        const value = this.tableUtils.makeValue(
          column.type,
          text,
          this.formatter.timeZone
        );
        const formattedText =
          value != null
            ? this.displayString(value, column.type, column.name)
            : null;
        this.cachePendingValue(x, y, formattedText);

        // Take care of updates to the pending new area as well, as that can be updated synchronously
        const pendingRow = this.pendingRow(y);
        if (pendingRow != null) {
          if (!newDataMap.has(pendingRow)) {
            newDataMap.set(pendingRow, { data: new Map() } as R);
          }

          const row = newDataMap.get(pendingRow);
          assertNotNull(row);
          const { data: rowData } = row;
          const newRowData = new Map(rowData);
          if (value != null) {
            newRowData.set(x, { value });
          } else {
            newRowData.delete(x);
          }
          if (newRowData.size > 0) {
            newDataMap.set(pendingRow, { ...row, data: newRowData });
          } else {
            newDataMap.delete(pendingRow);
          }
        }
      });

      this.pendingDataMap = newDataMap;

      // Send an update right after setting the pending map so the values are displayed immediately
      this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));

      // Need to group by row...
      const rowEditMap = edits.reduce((rowMap, edit) => {
        const y = edit.row ?? edit.y;
        if (!rowMap.has(y)) {
          rowMap.set(y, []);
        }
        rowMap.get(y)?.push(edit);
        return rowMap;
      }, new Map<ModelIndex, EditOperation[]>());

      const ranges = GridRange.consolidate(
        edits.map(edit =>
          GridRange.makeCell(edit.column ?? edit.x, edit.row ?? edit.y)
        )
      );
      const tableAreaRange = this.getTableAreaRange();
      const tableRanges = ranges
        .map(range => GridRange.intersection(tableAreaRange, range))
        .filter(range => range != null);

      if (tableRanges.length > 0) {
        // Get a snapshot of the full rows, as we need to write a full row when editing
        const data = await this.snapshot(
          tableRanges.map(range => {
            assertNotNull(range);
            return new GridRange(null, range.startRow, null, range.endRow);
          })
        );
        const newRows = data.map((row, dataIndex) => {
          let rowIndex = null;
          let r = dataIndex;
          for (let i = 0; i < tableRanges.length; i += 1) {
            const range = tableRanges[i];
            assertNotNull(range);
            const rangeRowCount = GridRange.rowCount([range]);
            if (r < rangeRowCount) {
              assertNotNull(range.startRow);
              rowIndex = range.startRow + r;
              break;
            }
            r -= rangeRowCount;
          }

          const newRow: Record<ColumnName, unknown> = {};
          for (let c = 0; c < this.columns.length; c += 1) {
            newRow[this.columns[c].name] = row[c];
          }
          assertNotNull(rowIndex);
          const rowEdits = rowEditMap.get(rowIndex);
          if (rowEdits != null) {
            rowEdits.forEach(edit => {
              const column = this.columns[edit.column ?? edit.x];
              newRow[column.name] = this.tableUtils.makeValue(
                column.type,
                edit.text,
                this.formatter.timeZone
              );
            });
          }
          return newRow;
        });

        log.info('setValues setting tableRanges', tableRanges);

        const result = await this.inputTable?.addRows(newRows);

        log.info('setValues set tableRanges', tableRanges, 'SUCCESS', result);
      }

      // We've sent the changes to the server, but have not yet got an update with those changes committed
      // Add the changes to the formatted cache so it's still displayed until the update event is received
      // The update event could be received on the next tick, after the input rows have been committed,
      // so make sure we don't display stale data
      edits.forEach(edit => {
        const { text } = edit;
        const x = edit.column ?? edit.x;
        const y = edit.row ?? edit.y;
        const column = this.columns[x];
        const value = this.tableUtils.makeValue(
          column.type,
          text,
          this.formatter.timeZone
        );
        const formattedText =
          value != null
            ? this.displayString(value, column.type, column.name)
            : null;

        this.cacheFormattedValue(x, y, formattedText);
      });
    } finally {
      edits.forEach(edit => {
        this.clearPendingValue(edit.column, edit.row);
      });
    }
  }

  async commitPending(): Promise<void> {
    if (this.pendingNewDataMap.size <= 0) {
      throw new Error('No pending changes to commit');
    }

    try {
      this.isSaveInProgress = true;

      const newRows: Record<ColumnName, unknown>[] = [];
      this.pendingNewDataMap.forEach(row => {
        const newRow: Record<ColumnName, unknown> = {};
        row.data.forEach(({ value }, columnIndex) => {
          const columnName =
            typeof columnIndex === 'string'
              ? columnIndex
              : this.columns[columnIndex].name;
          newRow[columnName] = value;
        });
        newRows.push(newRow);
      });
      const result = await this.inputTable?.addRows(newRows);

      log.debug('commitPending()', this.pendingNewDataMap, 'result', result);

      this.pendingNewDataMap = new Map();
      this.pendingNewRowCount = Math.max(
        0,
        (this.viewport?.bottom ?? 0) - this.table.size
      );
      this.formattedStringData = [];

      this.dispatchEvent(
        new EventShimCustomEvent(IrisGridModel.EVENT.PENDING_DATA_UPDATED)
      );
    } finally {
      this.isSaveInProgress = false;
    }
  }

  editValueForCell(column: ModelIndex, row: ModelIndex): string {
    return this.textValueForCell(column, row) ?? '';
  }

  async delete(ranges: readonly GridRange[]): Promise<void> {
    throw new Error('Delete not implemented');
  }

  isValidForCell(x: ModelIndex, y: ModelIndex, value: string): boolean {
    try {
      const column = this.columns[x];
      this.tableUtils.makeValue(column.type, value, this.formatter.timeZone);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default IrisGridTableModelTemplate;
