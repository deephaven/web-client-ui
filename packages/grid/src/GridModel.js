import { EventTarget } from 'event-target-shim';

/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
/**
 * Model for a Grid
 * All of these methods should return very quickly, as they will be called many times in the render cycle.
 * If data needs to be loaded asynchronously, return something immediately, then trigger an event for the table to refresh (Not yet implemented).
 */
class GridModel extends EventTarget {
  /** Count of rows in the grid */
  get rowCount() {
    return 0;
  }

  /** Count of rows that are frozen (or 'floating') at the top */
  get floatingTopRowCount() {
    return 0;
  }

  /** Count of rows that are frozen at the bottom */
  get floatingBottomRowCount() {
    return 0;
  }

  get columnCount() {
    return 0;
  }

  get floatingLeftColumnCount() {
    return 0;
  }

  get floatingRightColumnCount() {
    return 0;
  }

  /*
   * @returns {boolean} True if the edit functionality is available
   */
  get isEditable() {
    return false;
  }

  textForCell(column, row) {
    return '';
  }

  textAlignForCell(column, row) {
    return 'left';
  }

  colorForCell(column, row, theme) {
    return theme.textColor;
  }

  backgroundColorForCell(column, row, theme) {
    return null;
  }

  textForColumnHeader(column) {
    return '';
  }

  textForRowHeader(row) {
    return '';
  }

  textForRowFooter(row) {
    return '';
  }

  /*
   * Check if a given range is editable
   * @param {GridRange} range The range to check if it is editable
   * @returns {boolean} True if the range is editable
   */
  isEditableRange(range) {
    return this.isEditable;
  }

  /**
   * @param {number} column The column to check
   */
  isColumnMovable(column) {
    return true;
  }

  isColumnFrozen(column) {
    return false;
  }

  isRowMovable(row) {
    return true;
  }

  get hasExpandableRows() {
    return false;
  }

  isRowExpandable(row) {
    return false;
  }

  isRowExpanded(row) {
    return false;
  }

  setRowExpanded(row, isExpanded) {}

  depthForRow(row) {
    return 0;
  }

  /**
   * Get the edit text for a cell as a string
   * @param {number} x The column to get
   * @param {number} y The row to get
   * @returns {string} The value to use for editing
   */
  editValueForCell(x, y) {
    throw new Error('editValueForCell not implemented');
  }

  /**
   * Set value in an editable table
   * @param {number} x The column to set
   * @param {number} y The row to set
   * @param {string} value The value to set
   * @returns {Promise<void>} A promise that resolves successfully when the operation is complete, or rejects if there's an error
   */
  async setValueForCell(x, y, value) {
    throw new Error('setValueForCell not implemented');
  }

  /**
   * Set value in an editable table
   * @param {GridRange[]} ranges The ranges to set
   * @param {string} value The value to set
   * @returns {Promise<void>} A promise that resolves successfully when the operation is complete, or rejects if there's an error
   */
  async setValueForRanges(ranges, value) {
    throw new Error('setValueForRanges not implemented');
  }

  /**
   * Apply edits to the model
   * @param {{
   *   x: number,
   *   y: number,
   *   text: string,
   * }[]} edits The edits to apply to the model
   */
  async setValues(edits) {
    throw new Error('setValues not implemented');
  }

  /**
   * Check if a text value is a valid edit for a cell
   * @param {number} x The column to check
   * @param {number} y The row to check
   * @param {string} value The value to check if it's a valid value or not
   * @returns {boolean} returns true if it's a valid value, false otherwise
   */
  isValidForCell(x, y, value) {
    throw new Error('isValidForCell not implemented');
  }

  /**
   * Delete ranges from an editable table
   * @param {GridRange[]} ranges The ranges to delete
   * @returns {unknown} The result of the delete
   */
  delete(ranges) {
    throw new Error('delete not implemented');
  }
}

export default GridModel;
