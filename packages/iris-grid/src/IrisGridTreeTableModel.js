/* eslint class-methods-use-this: "off" */
import memoize from 'memoize-one';
import Log from '@deephaven/log';
import { GridRange } from '@deephaven/grid';
import IrisGridTableModel from './IrisGridTableModel';
import IrisGridUtils from './IrisGridUtils';

const log = Log.module('IrisGridTreeTableModel');

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

  snapshot(ranges) {
    const { columns } = this.viewport;
    const result = [];
    const viewportRange = new GridRange(
      0,
      this.viewportData.offset,
      columns.length,
      this.viewportData.offset + this.viewportData.rows.length
    );
    const intersection = GridRange.intersection(viewportRange, ranges);

    for (let i = intersection.startRow; i < intersection.endRow; i += 1) {
      const row = this.viewportData.rows[i];
      result.push([...row.data.values()].map(rowVal => rowVal.value));
    }
    return result;
  }

  textSnapshot(
    ranges,
    includeHeaders = false,
    formatValue = value => `${value}`
  ) {
    log.debug2('textSnapshot', ranges, includeHeaders);

    const data = this.snapshot(ranges, includeHeaders, formatValue);
    return data.map(row => row.join('\t')).join('\n');
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
