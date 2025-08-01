/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import {
  type BoundedAxisRange,
  type GridCell,
  GridRange,
  type ModelIndex,
} from '@deephaven/grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import {
  assertNotNull,
  EMPTY_ARRAY,
  EventShimCustomEvent,
} from '@deephaven/utils';
import { type UIRow, type ColumnName } from './CommonTypes';
import IrisGridTableModelTemplate from './IrisGridTableModelTemplate';
import IrisGridModel, { type DisplayColumn } from './IrisGridModel';
import { type IrisGridThemeType } from './IrisGridTheme';
import IrisGridUtils from './IrisGridUtils';

const log = Log.module('IrisGridTreeTableModel');

const VirtualGroupColumn = Object.freeze({
  name: '__DH_UI_GROUP__',
  displayName: 'Group',
  type: TableUtils.dataType.STRING,
  constituentType: TableUtils.dataType.STRING,
  isPartitionColumn: false,
  isSortable: false,
  isProxy: true,
  description: 'Key column',
  index: -1,
  filter: () => {
    throw new Error('Filter not implemented for virtual column');
  },
  sort: () => {
    throw new Error('Sort not implemented for virtual column');
  },
  formatColor: () => {
    throw new Error('Color not implemented for virtual column');
  },
  get: () => {
    throw new Error('get not implemented for virtual column');
  },
  getFormat: () => {
    throw new Error('getFormat not implemented for virtual column');
  },
  formatNumber: () => {
    throw new Error('formatNumber not implemented for virtual column');
  },
  formatDate: () => {
    throw new Error('formatDate not implemented for virtual column');
  },
});

export interface UITreeRow extends UIRow {
  isExpanded: boolean;
  hasChildren: boolean;
  depth: number;
}

/**
 * Check if a row is a UITreeRow
 * @param row The row to check
 * @returns True if the row is a UITreeRow and false otherwise
 */
export function isUITreeRow(row: unknown): row is UITreeRow {
  return (
    row != null &&
    typeof row === 'object' &&
    'hasChildren' in row &&
    'isExpanded' in row &&
    'depth' in row &&
    typeof row.hasChildren === 'boolean' &&
    typeof row.isExpanded === 'boolean' &&
    typeof row.depth === 'number'
  );
}

type LayoutTreeTable = DhType.TreeTable & {
  layoutHints?: null | DhType.LayoutHints;
};

function isLayoutTreeTable(table: DhType.TreeTable): table is LayoutTreeTable {
  return (table as LayoutTreeTable).layoutHints !== undefined;
}

export function isIrisGridTreeTableModel(
  tableModel: IrisGridModel
): tableModel is IrisGridTreeTableModel {
  return (tableModel as IrisGridTreeTableModel).showExtraGroupColumn != null;
}

class IrisGridTreeTableModel extends IrisGridTableModelTemplate<
  DhType.TreeTable,
  UITreeRow
> {
  /** We keep a virtual column at the front that tracks the "group" that is expanded */
  private virtualColumns: DisplayColumn[];

  private showExtraGroupCol = true;

  constructor(
    dh: typeof DhType,
    table: DhType.TreeTable,
    formatter = new Formatter(dh),
    inputTable: DhType.InputTable | null = null,
    columnAlignmentMap = new Map<string, CanvasTextAlign>()
  ) {
    super(dh, table, formatter, inputTable, columnAlignmentMap);

    this.virtualColumns =
      this.showExtraGroupColumn && table.groupedColumns.length > 1
        ? [VirtualGroupColumn]
        : [];
  }

  get showExtraGroupColumn(): boolean {
    return this.showExtraGroupCol;
  }

  set showExtraGroupColumn(showExtraGroupCol: boolean) {
    if (this.showExtraGroupCol === showExtraGroupCol) {
      return;
    }
    this.showExtraGroupCol = showExtraGroupCol;
    this.updateVirtualColumns();
  }

  updateVirtualColumns(): void {
    this.virtualColumns =
      this.showExtraGroupColumn && this.table.groupedColumns.length > 1
        ? [VirtualGroupColumn]
        : [];
    this.dispatchEvent(
      new EventShimCustomEvent(IrisGridModel.EVENT.COLUMNS_CHANGED, {
        detail: this.columns,
      })
    );
  }

  applyBufferedViewport(
    viewportTop: number,
    viewportBottom: number,
    columns: DhType.Column[]
  ): void {
    const viewportColumns = [
      // Need to always fetch the grouped columns so we always have key data for the rows
      // Used to display our virtual key column
      ...this.table.groupedColumns,
      ...columns.filter(
        c =>
          !this.virtualColumns.includes(c) && !this.groupedColumns.includes(c)
      ),
    ];
    this.table.setViewport(viewportTop, viewportBottom, viewportColumns);
  }

  textForCell(x: ModelIndex, y: ModelIndex): string {
    const column = this.sourceColumn(x, y);
    const row = this.row(y);
    if (row != null && column != null) {
      if (!row.hasChildren && column.constituentType != null) {
        const value = this.valueForCell(x, y);
        const text = this.displayString(
          value,
          column.constituentType,
          column.name
        );

        if (TableUtils.isTextType(this.columns[x]?.type)) {
          if (value === null) {
            return this.formatter.showNullStrings ? 'null' : '';
          }

          if (text === '') {
            return this.formatter.showEmptyStrings ? 'empty' : '';
          }
        }

        return text;
      }

      // Show empty string instead of null in rollup grouping columns (issue #1483)
      if (
        row.hasChildren &&
        row.depth <= x + 1 &&
        this.valueForCell(x, y) === null &&
        this.getCachedGroupedColumnSet(this.groupedColumns).has(x)
      ) {
        return '';
      }
    }

    return super.textForCell(x, y);
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

      // Fallback to formatting based on the value/type of the cell
      if (value != null) {
        const column = this.sourceColumn(x, y);
        const row = this.row(y);
        assertNotNull(row);

        let columnTypeForFormatting = column.type;

        // For tree table leaf nodes, use the constituent type for formatting
        if (
          isUITreeRow(row) &&
          row.hasChildren === false &&
          column.constituentType != null
        ) {
          columnTypeForFormatting = column.constituentType;
        }

        return IrisGridUtils.colorForValue(
          theme,
          columnTypeForFormatting,
          column.name,
          value
        );
      }
    }

    return theme.textColor;
  }

  textAlignForCell(x: ModelIndex, y: ModelIndex): CanvasTextAlign {
    const column = this.sourceColumn(x, y);

    const userTextAlignment = this.columnAlignmentMap?.get(column.name);
    if (userTextAlignment != null) {
      return userTextAlignment;
    }

    const row = this.row(y);
    assertNotNull(row);

    let typeForFormatting = column.type;

    // For tree table leaf nodes, use the constituent type for formatting
    if (
      isUITreeRow(row) &&
      row.hasChildren === false &&
      column.constituentType != null
    ) {
      typeForFormatting = column.constituentType;
    }

    return IrisGridUtils.textAlignForValue(typeForFormatting, column.name);
  }

  extractViewportRow(row: DhType.TreeRow, columns: DhType.Column[]): UITreeRow {
    const { isExpanded, hasChildren, depth } = row;
    const extractedRow = super.extractViewportRow(row, columns);
    const modifiedData = new Map(extractedRow.data);
    if (hasChildren) {
      for (let i = 0; i < this.virtualColumns.length; i += 1) {
        const key = i + (depth - 1) + (this.virtualColumns.length - 1);
        const cellData = modifiedData.get(key);
        if (cellData == null) {
          log.warn('Missing key data for virtual column', i, depth, key, row);
        } else {
          modifiedData.set(i, cellData);
        }
      }
    }

    return {
      ...extractedRow,
      data: modifiedData,
      isExpanded,
      hasChildren,
      depth,
    };
  }

  async snapshot(
    ranges: GridRange[],
    includeHeaders?: boolean,
    formatValue: (value: unknown, column: DhType.Column) => unknown = value =>
      value
  ): Promise<unknown[][]> {
    assertNotNull(this.viewport);
    assertNotNull(this.viewportData);
    const columns = this.viewport.columns ?? this.columns;
    const result = [];

    if (includeHeaders != null && includeHeaders) {
      result.push(columns.map(c => c.name));
    }

    const viewportRange = new GridRange(
      0,
      this.viewportData.offset,
      columns.length,
      this.viewportData.offset + this.viewportData.rows.length - 1
    );

    for (let i = 0; i < ranges.length; i += 1) {
      const intersection = GridRange.intersection(viewportRange, ranges[i]);

      assertNotNull(intersection);
      assertNotNull(intersection.startRow);
      assertNotNull(intersection.endRow);

      for (let r = intersection.startRow; r <= intersection.endRow; r += 1) {
        const resultRow = [];
        const viewportRow =
          this.viewportData.rows[r - this.viewportData.offset];
        assertNotNull(intersection.startColumn);
        assertNotNull(intersection.endColumn);
        for (
          let c = intersection.startColumn;
          c <= intersection.endColumn;
          c += 1
        ) {
          resultRow.push(
            formatValue(viewportRow.data.get(c)?.value, this.columns[c])
          );
        }
        result.push(resultRow);
      }
    }

    return result;
  }

  get columns(): DhType.Column[] {
    return this.getCachedColumns(this.virtualColumns, super.columns);
  }

  get aggregatedColumns(): readonly DhType.Column[] {
    return this.isAggregatedColumnsAvailable
      ? this.table.aggregatedColumns
      : EMPTY_ARRAY;
  }

  get groupedColumns(): readonly DhType.Column[] {
    return this.getCachedGroupColumns(
      this.virtualColumns,
      this.table.groupedColumns
    );
  }

  sourceForCell(column: ModelIndex, row: ModelIndex): GridCell {
    if (column >= this.virtualColumns.length) {
      return { column, row };
    }
    const depth = this.depthForRow(row);
    return { column: column + depth, row };
  }

  sourceColumn(column: ModelIndex, row: ModelIndex): DhType.Column {
    if (column >= this.virtualColumns.length) {
      return super.sourceColumn(column, row);
    }

    const depth = this.depthForRow(row);
    return this.columns[column + depth];
  }

  getClearFilterRange(column: ModelIndex): BoundedAxisRange | null {
    if (column >= this.virtualColumns.length) {
      return super.getClearFilterRange(column);
    }
    // Source for the proxied column could be any of the grouped columns.
    // Return the range of columns matching the grouped columns.
    return [this.virtualColumns.length, this.groupedColumns.length];
  }

  get layoutHints(): DhType.LayoutHints | null | undefined {
    if (isLayoutTreeTable(this.table)) {
      return this.table.layoutHints;
    }
    return undefined;
  }

  get hasExpandableRows(): boolean {
    return true;
  }

  get isAggregatedColumnsAvailable(): boolean {
    return (
      // aggregatedColumns are not available in the Legacy API
      // and Core API before v0.39.4
      this.table.aggregatedColumns !== undefined
    );
  }

  get isExpandAllAvailable(): boolean {
    return this.table.expandAll !== undefined;
  }

  get isChartBuilderAvailable(): boolean {
    return false;
  }

  get isOrganizeColumnsAvailable(): boolean {
    return true;
  }

  get isSelectDistinctAvailable(): boolean {
    return false;
  }

  get isReversible(): boolean {
    return false;
  }

  isFilterable(columnIndex: ModelIndex): boolean {
    return this.getCachedFilterableColumnSet(
      this.columns,
      this.isAggregatedColumnsAvailable,
      this.aggregatedColumns,
      this.groupedColumns,
      this.virtualColumns
    ).has(columnIndex);
  }

  isColumnMovable(column: ModelIndex): boolean {
    return column >= this.groupedColumns.length;
  }

  isRowExpandable(y: ModelIndex): boolean {
    const row = this.row(y);
    return row?.hasChildren ?? false;
  }

  isRowExpanded(y: ModelIndex): boolean {
    const row = this.row(y);
    return row?.isExpanded ?? false;
  }

  setRowExpanded(
    y: ModelIndex,
    isExpanded: boolean,
    expandDescendants = false
  ): void {
    if (this.isExpandAllAvailable) {
      this.table.setExpanded(y, isExpanded, expandDescendants);
    } else {
      this.table.setExpanded(y, isExpanded);
    }
  }

  expandAll(): void {
    if (this.table.expandAll != null) {
      this.table.expandAll();
    }
  }

  collapseAll(): void {
    if (this.table.collapseAll != null) {
      this.table.collapseAll();
    }
  }

  depthForRow(y: ModelIndex): ModelIndex {
    const row = this.row(y);
    return (row?.depth ?? 1) - 1;
  }

  getCachedColumns = memoize(
    (
      virtualColumns: readonly DhType.Column[],
      tableColumns: readonly DhType.Column[]
    ) => [...virtualColumns, ...tableColumns]
  );

  getCachedGroupColumns = memoize(
    (
      virtualColumns: readonly DhType.Column[],
      tableGroupedColumns: readonly DhType.Column[]
    ) => [...virtualColumns, ...tableGroupedColumns]
  );

  getCachedFilterableColumnSet = memoize(
    (
      columns: readonly DhType.Column[],
      isAggregatedColumnsAvailable: boolean,
      aggregatedColumns: readonly DhType.Column[],
      groupedColumns: readonly DhType.Column[],
      virtualColumns: readonly DhType.Column[]
    ) => {
      if (isAggregatedColumnsAvailable) {
        return new Set(
          // Virtual and aggregated columns are not filterable
          columns
            .filter(
              c => !virtualColumns.includes(c) && !aggregatedColumns.includes(c)
            )
            .map(c1 => columns.findIndex(c2 => c1.name === c2.name))
        );
      }
      // For compatibility with the Enterprise JSAPI,
      // only groupedColumns are filterable on rollup tables
      // if aggregatedColumns API is not available.
      return new Set(
        (groupedColumns?.length > 0 ? groupedColumns : columns)
          .filter(c => !virtualColumns.includes(c))
          .map(c1 => columns.findIndex(c2 => c1.name === c2.name))
      );
    }
  );

  getCachedGroupedColumnSet = memoize(
    (groupedColumns: readonly DhType.Column[]) =>
      new Set(
        groupedColumns.map(c1 =>
          this.columns.findIndex(c2 => c1.name === c2.name)
        )
      )
  );

  updateFrozenColumns(columns: ColumnName[]): void {
    if (columns.length > 0) {
      throw new Error('Cannot freeze columns on a tree table');
    }
  }
}

export default IrisGridTreeTableModel;
