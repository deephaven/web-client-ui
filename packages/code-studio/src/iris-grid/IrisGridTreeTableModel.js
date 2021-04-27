/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import IrisGridTableModel from './IrisGridTableModel';

class IrisGridTreeTableModel extends IrisGridTableModel {
  applyBufferedViewport(viewportTop, viewportBottom, columns) {
    this.table.setViewport(viewportTop, viewportBottom, columns);
  }

  textForCell(x, y) {
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

  get groupedColumns() {
    return this.table.groupedColumns ?? [];
  }

  get hasExpandableRows() {
    return true;
  }

  get isChartBuilderAvailable() {
    return false;
  }

  get isSelectDistinctAvailable() {
    return false;
  }

  get isReversible() {
    return false;
  }

  isFilterable(columnIndex) {
    return this.getCachedFilterableColumnSet(
      this.columns,
      this.groupedColumns
    ).has(columnIndex);
  }

  isColumnMovable(column) {
    return column >= this.groupedColumns.length;
  }

  isRowExpandable(y) {
    const row = this.row(y);
    return row?.hasChildren ?? false;
  }

  isRowExpanded(y) {
    const row = this.row(y);
    return row?.isExpanded ?? false;
  }

  setRowExpanded(y, isExpanded) {
    this.table.setExpanded(y, isExpanded);
  }

  depthForRow(y) {
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
