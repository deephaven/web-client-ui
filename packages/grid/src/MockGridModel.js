/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import GridModel from './GridModel';

class MockGridModel extends GridModel {
  constructor({
    rowCount = 1000000000,
    columnCount = 100,
    floatingTopRowCount = 0,
    floatingBottomRowCount = 0,
    floatingLeftColumnCount = 0,
    floatingRightColumnCount = 0,
  } = {}) {
    super();

    this.numRows = rowCount;
    this.numColumns = columnCount;
    this.floatingTop = floatingTopRowCount;
    this.floatingBottom = floatingBottomRowCount;
    this.floatingLeft = floatingLeftColumnCount;
    this.floatingRight = floatingRightColumnCount;
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

  textForCell(column, row) {
    return `${column},${row}`;
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
}

export default MockGridModel;
