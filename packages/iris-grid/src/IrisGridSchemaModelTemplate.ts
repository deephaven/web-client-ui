/* eslint-disable no-underscore-dangle */
/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import {
  GridRange,
  GridUtils,
  ModelIndex,
  MoveOperation,
  VisibleIndex,
} from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { EMPTY_ARRAY, EMPTY_MAP, EventShimCustomEvent } from '@deephaven/utils';
import { Formatter } from '@deephaven/jsapi-utils';
import IrisGridModel, { DisplayColumn } from './IrisGridModel';
import IrisGridUtils from './IrisGridUtils';
import {
  ColumnName,
  UITotalsTableConfig,
  PendingDataMap,
  CellData,
  PendingDataErrorMap,
} from './CommonTypes';
import ColumnHeaderGroup, { isColumnHeaderGroup } from './ColumnHeaderGroup';

/**
 * Template model for a grid with a schema and no rows
 */

class IrisGridSchemaModelTemplate extends IrisGridModel {
  private modelFormatter: Formatter;

  private _columns: DhType.Column[];

  private _columnHeaderGroupMap: Map<string, ColumnHeaderGroup> = new Map();

  private columnHeaderParentMap: Map<string, ColumnHeaderGroup> = new Map();

  private _columnHeaderMaxDepth: number | null = null;

  private _columnHeaderGroups: ColumnHeaderGroup[] = [];

  private _movedColumns: MoveOperation[] | null = null;

  /**
   * @param dh JSAPI instance
   * @param columns Columns array to be used in the model
   * @param formatter The formatter to use when getting formats
   */
  constructor(
    dh: typeof DhType,
    columns: DhType.Column[],
    formatter = new Formatter(dh)
  ) {
    super(dh);

    this.modelFormatter = formatter;
    this._columns = columns;
    this.columnHeaderGroups = IrisGridUtils.parseColumnHeaderGroups(
      this,
      this.layoutHints?.columnGroups ?? []
    ).groups;
  }

  get rowCount(): number {
    return 0;
  }

  get columnCount(): number {
    return this.columns.length;
  }

  textForCell(column: number, row: number): string {
    return '';
  }

  textForColumnHeader(x: ModelIndex, depth = 0): string | undefined {
    const header = this.columnAtDepth(x, depth);
    if (isColumnHeaderGroup(header)) {
      return header.isNew ? '' : header.name;
    }
    return header?.displayName ?? header?.name;
  }

  /**
   * Returns an array of the columns in the model
   * The order of model columns should never change once established
   */
  get columns(): readonly DhType.Column[] {
    return this._columns;
  }

  /**
   * Use this as the canonical column index since things like layoutHints could have
   * changed the column order.
   */
  getColumnIndexByName(name: ColumnName): number | undefined {
    return this.getColumnIndicesByNameMap(this.columns).get(name);
  }

  getColumnIndicesByNameMap = memoize(
    (columns: readonly DhType.Column[]): Map<ColumnName, ModelIndex> => {
      const indices = new Map();
      columns.forEach(({ name }, i) => indices.set(name, i));
      return indices;
    }
  );

  get initialMovedRows(): readonly MoveOperation[] {
    return EMPTY_ARRAY;
  }

  formatForCell(
    column: ModelIndex,
    row: ModelIndex
  ): DhType.Format | undefined {
    return undefined;
  }

  valueForCell(column: ModelIndex, row: ModelIndex): unknown {
    return undefined;
  }

  get filter(): readonly DhType.FilterCondition[] {
    // TODO: retrieve from this._filter?
    return EMPTY_ARRAY;
  }

  set filter(filter: readonly DhType.FilterCondition[]) {
    // No-op
  }

  get partition(): readonly unknown[] {
    // TODO: retrieve from this._partition?
    return EMPTY_ARRAY;
  }

  set partition(partition: readonly unknown[]) {
    // No-op
  }

  get partitionColumns(): readonly DhType.Column[] {
    return EMPTY_ARRAY;
  }

  get formatter(): Formatter {
    return this.modelFormatter;
  }

  set formatter(formatter: Formatter) {
    this.modelFormatter = formatter;
  }

  displayString(
    value: unknown,
    columnType: string,
    columnName?: ColumnName
  ): string {
    return '';
  }

  get sort(): readonly DhType.Sort[] {
    return EMPTY_ARRAY;
  }

  set sort(sort: readonly DhType.Sort[]) {
    // No-op
  }

  get customColumns(): readonly ColumnName[] {
    return EMPTY_ARRAY;
  }

  set customColumns(customColumns: readonly ColumnName[]) {
    // No-op
  }

  get formatColumns(): readonly DhType.CustomColumn[] {
    return EMPTY_ARRAY;
  }

  updateFrozenColumns(columns: readonly ColumnName[]): void {
    // No-op
  }

  get rollupConfig(): DhType.RollupConfig | null {
    return null;
  }

  set rollupConfig(rollupConfig: DhType.RollupConfig | null) {
    // No-op
  }

  get totalsConfig(): UITotalsTableConfig | null {
    return null;
  }

  set totalsConfig(totalsConfig: UITotalsTableConfig | null) {
    // No-op
  }

  export(): Promise<DhType.Table> {
    throw new Error('Method not implemented.');
  }

  columnStatistics(column: DhType.Column): Promise<DhType.ColumnStatistics> {
    throw new Error('Method not implemented.');
  }

  get selectDistinctColumns(): readonly ColumnName[] {
    return EMPTY_ARRAY;
  }

  set selectDistinctColumns(selectDistinctColumns: readonly ColumnName[]) {
    // No-op
  }

  get pendingDataMap(): PendingDataMap {
    return EMPTY_MAP;
  }

  set pendingDataMap(map: PendingDataMap) {
    // No-op
  }

  get pendingRowCount(): number {
    return 0;
  }

  set pendingRowCount(count: number) {
    // No-op
  }

  get pendingDataErrors(): PendingDataErrorMap {
    return EMPTY_MAP;
  }

  commitPending(): Promise<void> {
    return Promise.resolve();
  }

  setViewport(
    top: VisibleIndex,
    bottom: VisibleIndex,
    columns?: DhType.Column[]
  ): void {
    this.dispatchEvent(new EventShimCustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  snapshot(ranges: readonly GridRange[]): Promise<readonly unknown[][]> {
    return Promise.resolve([]);
  }

  textSnapshot(
    ranges: readonly GridRange[],
    includeHeaders?: boolean,
    formatValue?: (
      value: unknown,
      column: DhType.Column,
      row?: DhType.Row
    ) => string
  ): Promise<string> {
    return Promise.resolve('');
  }

  valuesTable(
    columns: DhType.Column | readonly DhType.Column[]
  ): Promise<DhType.Table> {
    throw new Error('Method not implemented.');
  }

  delete(ranges: readonly GridRange[]): Promise<void> {
    return Promise.resolve();
  }

  seekRow(
    startRow: number,
    column: DhType.Column,
    valueType: unknown,
    value: unknown,
    insensitive?: boolean,
    contains?: boolean,
    isBackwards?: boolean
  ): Promise<number> {
    return Promise.resolve(0);
  }

  close(): void {
    // No-op
  }

  get maxPendingDataRow(): number {
    return 0;
  }

  get floatingBottomRowCount(): number {
    return 0;
  }

  get floatingTopRowCount(): number {
    return 0;
  }

  get isEditable(): boolean {
    return false;
  }

  colorForColumnHeader(x: ModelIndex, depth = 0): string | null {
    const column = this.columnAtDepth(x, depth);
    if (isColumnHeaderGroup(column)) {
      return column.color ?? null;
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

  private getMemoizedInitialMovedColumns = memoize(
    (layoutHints?: DhType.LayoutHints): readonly MoveOperation[] => {
      if (!layoutHints) {
        return EMPTY_ARRAY;
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

        let backIndex = this.columnMap.size - 1;
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

  get initialColumnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return this.getMemoizedInitialColumnHeaderGroups(
      this.layoutHints ?? undefined
    );
  }

  getMemoizedColumnMap = memoize(
    (tableColumns: readonly DhType.Column[]): Map<string, DhType.Column> => {
      const columnMap = new Map();
      tableColumns.forEach(col => columnMap.set(col.name, col));
      return columnMap;
    }
  );

  get columnMap(): Map<ColumnName, DhType.Column> {
    return this.getMemoizedColumnMap(this.columns);
  }

  get columnHeaderMaxDepth(): number {
    return this._columnHeaderMaxDepth ?? 1;
  }

  private set columnHeaderMaxDepth(depth: number) {
    this._columnHeaderMaxDepth = depth;
  }

  get columnHeaderGroupMap(): ReadonlyMap<string, ColumnHeaderGroup> {
    return this._columnHeaderGroupMap;
  }

  get columnHeaderGroups(): readonly ColumnHeaderGroup[] {
    return this._columnHeaderGroups;
  }

  set columnHeaderGroups(groups: readonly ColumnHeaderGroup[]) {
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
  }

  /**
   * Check if a row is a pending input row
   * @param y The row in the model to check if it's a pending new row
   * @returns True if the row is a pending new row, false if not
   */
  isPendingRow(y: ModelIndex): boolean {
    return false;
  }

  dataForCell(x: ModelIndex, y: ModelIndex): CellData | undefined {
    return undefined;
  }

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
    return false;
  }

  isRowMovable(): boolean {
    return false;
  }

  // TODO: Add frozen columns, isColumnMoveable, isFilterable, etc. from IrisGridModel
}

export default IrisGridSchemaModelTemplate;
