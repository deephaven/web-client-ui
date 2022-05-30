/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import { GridRange } from '@deephaven/grid';
import IrisGridTableModel from './IrisGridTableModel';
import { Table } from '@deephaven/jsapi-shim';

class IrisGridTreeTableModel extends IrisGridTableModel {
  applyBufferedViewport(viewportTop, viewportBottom, columns) {
    this.table.setViewport(viewportTop, viewportBottom, columns);
  }

  textForCell(x: number, y: number) {
    const column = this.columns[x];
    const row = this.row(y);
    if (row != null && column != null) {
      if (!row.hasChildren && column.constituentType != null) {
        const value = this.valueForCell(x, y);
        return value != null
          ? this.displayString(value, column.constituentType, column.name)
          : null;
      }
    }

    return super.textForCell(x, y);
  }

  extractViewportRow(row, columns) {
    const { isExpanded, hasChildren, depth } = row;
    return {
      ...super.extractViewportRow(row, columns),
      isExpanded,
      hasChildren,
      depth,
    };
  }

  async snapshot(ranges, includeHeaders = false, formatValue = value => value) {
    const { columns } = this.viewport;
    const result = [];

    if (includeHeaders) {
      result.push(columns.map(c => c.name));
    }

    const viewportRange = new GridRange(
      0,
      this.viewportData.offset,
      columns.length,
      this.viewportData.offset + this.viewportData.rows.length
    );

    for (let i = 0; i < ranges.length; i += 1) {
      const intersection = GridRange.intersection(viewportRange, ranges[i]);

      for (let r = intersection.startRow; r <= intersection.endRow; r += 1) {
        const resultRow = [];
        const viewportRow = this.viewportData.rows[
          r - this.viewportData.offset
        ];
        for (
          let c = intersection.startColumn;
          c <= intersection.endColumn;
          c += 1
        ) {
          resultRow.push(
            formatValue(viewportRow.data.get(c).value, this.columns[c])
          );
        }
        result.push(resultRow);
      }
    }

    return result;
  }

  get groupedColumns() {
    return this.table.groupedColumns ?? [];
  }

  get hasExpandableRows(): boolean {
    return true;
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

  isFilterable(columnIndex): boolean {
    return this.getCachedFilterableColumnSet(
      this.columns,
      this.groupedColumns
    ).has(columnIndex);
  }

  isColumnMovable(column): boolean {
    return column >= this.groupedColumns.length;
  }

  isRowExpandable(y): boolean {
    const row = this.row(y);
    return row?.hasChildren ?? false;
  }

  isRowExpanded(y): boolean {
    const row = this.row(y);
    return row?.isExpanded ?? false;
  }

  setRowExpanded(y: number, isExpanded: boolean): void {
    this.table.setExpanded(y, isExpanded);
  }

  depthForRow(y: number): number {
    const row = this.row(y);
    return (row?.depth ?? 1) - 1;
  }

  getCachedFilterableColumnSet = memoize(
    (columns, groupedColumns) =>
      new Set(
        (groupedColumns?.length > 0 ? groupedColumns : columns).map(c1 =>
          columns.findIndex(c2 => c1.name === c2.name)
        )
      )
  );
}

export default IrisGridTreeTableModel;
