/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
/* eslint no-empty-function: "off" */
import memoize from 'memoize-one';
import { GridRange, MockTreeGridModel } from '@deephaven/grid';
import { IrisGridModel } from '@deephaven/iris-grid';

const EMPTY_ARRAY = [];

/**
 * A mock class that takes a GridModel and adds mock functionality for use in IrisGrid.
 * Useful for testing.
 */
class MockIrisGridTreeModel extends IrisGridModel {
  constructor(model = new MockTreeGridModel()) {
    super();

    this.model = model;
    this.formatMap = new Map();
    this.editedData = [];
  }

  // Delegate to the passed in model
  get rowCount() {
    return this.model.rowCount;
  }

  get columnCount() {
    return this.model.columnCount;
  }

  get floatingTopRowCount() {
    return 3;
  }

  get floatingBottomRowCount() {
    return 3;
  }

  get isEditable() {
    return true;
  }

  get pendingRowCount() {
    return 0;
  }

  set pendingRowCount(count) {}

  get pendingDataMap() {
    return new Map();
  }

  set pendingDataMap(value) {}

  textForCell(column, row) {
    return (
      this.editedData[column]?.[row] ?? this.model.textForCell(column, row)
    );
  }

  textForRowHeader(row) {
    return this.model.textForRowHeader(row);
  }

  textForRowFooter(row) {
    return this.model.textForRowHeader(row);
  }

  textForColumnHeader(column) {
    return this.model.textForColumnHeader(column);
  }

  get hasExpandableRows() {
    return this.model.hasExpandableRows;
  }

  isRowExpandable(row) {
    return this.model.isRowExpandable(row);
  }

  isRowExpanded(row) {
    return this.model.isRowExpanded(row);
  }

  setRowExpanded(row, isExpanded) {
    this.model.setRowExpanded(row, isExpanded);
  }

  depthForRow(row) {
    return this.model.depthForRow(row);
  }

  async columnFormatMap() {
    return this.formatMap;
  }

  // Stub out functions for IrisGridModel functionality
  get columns() {
    return this.getCachedColumns(this.columnCount);
  }

  get groupedColumns() {
    return EMPTY_ARRAY;
  }

  getCachedColumns = memoize(count => {
    const columns = [];
    for (let i = 0; i < count; i += 1) {
      columns.push({
        name: this.model.textForColumnHeader(i),
        type: 'java.lang.String',
        description: `Mock column ${i}`,
      });
    }
    return columns;
  });

  get description() {
    return 'A mock used for testing.';
  }

  get customColumns() {
    return [];
  }

  set customColumns(customColumns) {}

  get sort() {
    return [];
  }

  set sort(sort) {}

  get filter() {
    return [];
  }

  set filter(filter) {}

  set formatter(formatter) {}

  displayString(value) {
    return `${value}`;
  }

  valueForCell(column, row) {
    return this.textForCell(column, row);
  }

  formatForCell(column, row) {
    return null;
  }

  setViewport() {
    this.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  async setValueForCell(x, y, value) {
    if (this.editedData[x] == null) {
      this.editedData[x] = [];
    }
    this.editedData[x][y] = `${value}`;

    this.dispatchEvent(new CustomEvent(IrisGridModel.EVENT.UPDATED));
  }

  async setValueForRanges(ranges, text) {
    GridRange.forEachCell(ranges, (x, y) => {
      this.setValueForCell(x, y, text);
    });
  }

  editValueForCell(x, y) {
    return this.textForCell(x, y);
  }

  isValidForCell(x, y, value) {
    return true;
  }
}

export default MockIrisGridTreeModel;
