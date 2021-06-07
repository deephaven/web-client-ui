/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import GridModel from './GridModel';
import GridRange from './GridRange';

class MockGridModel extends GridModel {
  constructor({
    rowCount = 1000000000,
    columnCount = 100,
    floatingTopRowCount = 0,
    floatingBottomRowCount = 0,
    floatingLeftColumnCount = 0,
    floatingRightColumnCount = 0,
    isEditable = false,
  } = {}) {
    super();

    this.numRows = rowCount;
    this.numColumns = columnCount;
    this.floatingTop = floatingTopRowCount;
    this.floatingBottom = floatingBottomRowCount;
    this.floatingLeft = floatingLeftColumnCount;
    this.floatingRight = floatingRightColumnCount;
    this.editedData = [];
    this.editable = isEditable;
  }

  get rowCount() {
    return this.numRows;
  }

  get columnCount() {
    return this.numColumns;
  }

  get floatingTopRowCount() {
    return this.floatingTop;
  }

  get floatingBottomRowCount() {
    return this.floatingBottom;
  }

  get floatingLeftColumnCount() {
    return this.floatingLeft;
  }

  get floatingRightColumnCount() {
    return this.floatingRight;
  }

  get isEditable() {
    return this.editable;
  }

  textForCell(column, row) {
    return this.editedData[column]?.[row] ?? `${column},${row}`;
  }

  colorForCell(column, row, theme) {
    return theme.textColor;
  }

  textForColumnHeader(column) {
    return `${column}`;
  }

  textForRowHeader(row) {
    return `${row}`;
  }

  textForRowFooter(row) {
    return `${row}`;
  }

  async setValueForCell(x, y, value) {
    if (this.editedData[x] == null) {
      this.editedData[x] = [];
    }
    this.editedData[x][y] = `${value}`;
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

export default MockGridModel;
