/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import { GridCell, GridRange, ModelIndex } from '@deephaven/grid';
import type {
  dh as DhType,
  Column,
  InputTable,
  TreeRow,
  TreeTable,
} from '@deephaven/jsapi-types';
import { Formatter, TableUtils } from '@deephaven/jsapi-utils';
import { assertNotNull } from '@deephaven/utils';
import { UIRow, ColumnName, CellData } from './CommonTypes';
import IrisGridTableModelTemplate from './IrisGridTableModelTemplate';

export interface UITreeRow extends UIRow {
  isExpanded: boolean;
  hasChildren: boolean;
  depth: number;
}
class IrisGridTreeTableModel extends IrisGridTableModelTemplate<
  TreeTable,
  UITreeRow
> {
  /** We keep a virtual column at the front that tracks the "group" that is expanded */
  private virtualColumns: Column[];

  constructor(
    dh: DhType,
    table: TreeTable,
    formatter = new Formatter(dh),
    inputTable: InputTable | null = null
  ) {
    super(dh, table, formatter, inputTable);
    this.virtualColumns = [
      {
        name: 'Group',
        type: TableUtils.dataType.STRING,
        constituentType: TableUtils.dataType.STRING,
        isPartitionColumn: false,
        isSortable: false,
        description: 'Virtual column',
        filter: () => {
          throw new Error('Filter not implemented for virtual column');
        },
        sort: () => {
          throw new Error('Sort not implemented virtual column');
        },
        formatColor: () => {
          throw new Error('Color not implemented for virtual column');
        },
        formatRowColor: () => {
          throw new Error('Color not implemented for virtual column');
        },
      },
    ];
  }

  applyBufferedViewport(
    viewportTop: number,
    viewportBottom: number,
    columns: Column[]
  ): void {
    const viewportColumns = [
      // Need to always fetch the grouped columns
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
        return this.displayString(value, column.constituentType, column.name);
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

  extractViewportRow(row: TreeRow, columns: Column[]): UITreeRow {
    const { isExpanded, hasChildren, depth } = row;
    const extractedRow = super.extractViewportRow(row, columns);
    const modifiedData = new Map<ModelIndex, CellData>();
    if (hasChildren) {
      for (let i = 0; i < this.virtualColumns.length; i += 1) {
        const cellData = extractedRow.data.get(
          i + (depth - 1) + (this.virtualColumns.length - 1)
        );
        if (cellData != null) {
          modifiedData.set(i, cellData);
        }
      }
    }
    extractedRow.data.forEach((value, key) => {
      modifiedData.set(key, value);
    });

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
    formatValue?: (value: unknown, column: Column) => unknown
  ): Promise<unknown[][]> {
    assertNotNull(this.viewport);
    assertNotNull(this.viewportData);
    const { columns } = this.viewport;
    const result = [];

    if (includeHeaders != null && includeHeaders) {
      result.push(columns.map(c => c.name));
    }

    const viewportRange = new GridRange(
      0,
      this.viewportData?.offset,
      columns.length,
      this.viewportData.offset + this.viewportData.rows.length
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
          assertNotNull(formatValue);
          resultRow.push(
            formatValue(viewportRow.data.get(c)?.value, this.columns[c])
          );
        }
        result.push(resultRow);
      }
    }

    return result;
  }

  get columns(): Column[] {
    return this.getCachedColumns(this.virtualColumns, super.columns);
  }

  get groupedColumns(): readonly Column[] {
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

  get hasExpandableRows(): boolean {
    return true;
  }

  get isExpandAllAvailable(): boolean {
    return this.table.expandAll !== undefined;
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

  isFilterable(columnIndex: ModelIndex): boolean {
    return this.getCachedFilterableColumnSet(
      this.columns,
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
    if (this.table.expandAll) {
      this.table.expandAll();
    }
  }

  collapseAll(): void {
    if (this.table.collapseAll) {
      this.table.collapseAll();
    }
  }

  depthForRow(y: ModelIndex): ModelIndex {
    const row = this.row(y);
    return (row?.depth ?? 1) - 1;
  }

  getCachedColumns = memoize(
    (virtualColumns: readonly Column[], tableColumns: readonly Column[]) => [
      ...virtualColumns,
      ...tableColumns,
    ]
  );

  getCachedGroupColumns = memoize(
    (
      virtualColumns: readonly Column[],
      tableGroupedColumns: readonly Column[]
    ) => [...virtualColumns, ...tableGroupedColumns]
  );

  getCachedFilterableColumnSet = memoize(
    (
      columns: readonly Column[],
      groupedColumns: readonly Column[],
      virtualColumns: readonly Column[]
    ) =>
      new Set(
        (groupedColumns?.length > 0 ? groupedColumns : columns)
          .filter(c => !virtualColumns.includes(c))
          .map(c1 => columns.findIndex(c2 => c1.name === c2.name))
      )
  );

  getCachedGroupedColumnSet = memoize(
    (groupedColumns: readonly Column[]) =>
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
