/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import MockGridModel from './MockGridModel';
import memoizeClear from './memoizeClear';

/**
 * A class to mock a tree model so can test out tree models.
 * Whenever a row is expanded, it creates a child model for that row, which can then make a child for those rows, etc.
 */
class MockTreeGridModel extends MockGridModel {
  static DEFAULT_ROW_COUNT = 1000000000;

  static DEFAULT_COLUMN_COUNT = 100;

  /** How many rows a child tree should have related to the parent. Eg. if parent has 10000 rows, child will have 100 */
  static DEFAULT_CHILD_ROW_COUNT_FACTOR = 0.01;

  static MIN_CHILD_ROW_COUNT = 10;

  static MAX_DEPTH = 10;

  constructor({
    rowCount = MockTreeGridModel.DEFAULT_ROW_COUNT,
    columnCount = MockTreeGridModel.DEFAULT_COLUMN_COUNT,
    children = new Map(),
    childRowCount = Math.ceil(
      Math.max(
        MockTreeGridModel.MIN_CHILD_ROW_COUNT,
        rowCount * MockTreeGridModel.DEFAULT_CHILD_ROW_COUNT_FACTOR
      )
    ),
    maxDepth = MockTreeGridModel.MAX_DEPTH,
    movedColumns = [],
    movedRows = [],
    columnFormatMap = new Map(),
  } = {}) {
    super({ rowCount, columnCount, movedColumns, movedRows });

    this.children = children;
    this.childRowCount = childRowCount;
    this.maxDepth = maxDepth;
    this.formatMap = columnFormatMap;
  }

  textForCell(column, row) {
    return this.getCachedTextForCell(this.children, column, row);
  }

  textForRowHeader(row) {
    return this.getCachedTextForRowHeader(this.children, row);
  }

  isRowMovable(row) {
    return false;
  }

  get hasExpandableRows() {
    return true;
  }

  get floatingBottomRowCount() {
    return 0;
  }

  isRowExpandable(row) {
    return this.getCachedIsRowExpandable(this.children, row, this.maxDepth);
  }

  isRowExpanded(row) {
    return this.getCachedIsRowExpanded(this.children, row);
  }

  setRowExpanded(row, isExpanded) {
    const { key, offsetRow } = this.getCachedModelRowOffset(this.children, row);

    // We always set a new map so that our memoize functions work properly
    const children = new Map(this.children);
    if (key != null) {
      const model = this.children.get(key);
      const { rowCount: originalChildRowCount } = model;
      model.setRowExpanded(offsetRow, isExpanded);
      this.numRows += model.rowCount - originalChildRowCount;
    } else if (!isExpanded) {
      const childModel = children.get(offsetRow);
      this.numRows -= childModel.rowCount;
      children.delete(offsetRow);
    } else {
      const child = new MockTreeGridModel({
        rowCount: this.childRowCount,
        columnCount: this.numColumns,
      });
      children.set(offsetRow, child);
      this.numRows += child.rowCount;
    }

    this.children = children;
  }

  depthForRow(row) {
    return this.getCachedDepthForRow(this.children, row);
  }

  /**
   * Returns the map key and the offsetRow given the provided children and row index.
   * If the returned key is null, then this offset row is within this model.
   * Only returning the key instead of the model so that memoize doesn't cache a bunch of the children models after they've been deleted (collapsed).
   */
  getCachedModelRowOffset = memoizeClear((children, row) => {
    let key = null;
    let offsetRow = row;
    // Need to iterate through the map in order... sort it first
    const sortedEntries = [...children].sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < sortedEntries.length; i += 1) {
      const [childRow, childModel] = sortedEntries[i];
      if (offsetRow <= childRow) {
        break;
      }
      const childRowCount = childModel.rowCount;
      if (offsetRow <= childRow + childRowCount) {
        key = childRow;
        offsetRow = offsetRow - childRow - 1;
        break;
      }
      offsetRow -= childRowCount;
    }

    return { key, offsetRow };
  });

  getCachedTextForRowHeader = memoizeClear((children, row) => {
    const { key, offsetRow } = this.getCachedModelRowOffset(children, row);

    if (key != null) {
      const model = children.get(key);
      return `${key}.${model.textForRowHeader(offsetRow)}`;
    }

    return `${offsetRow}`;
  });

  getCachedTextForCell = memoizeClear((children, column, row) => {
    const { key, offsetRow } = this.getCachedModelRowOffset(children, row);

    if (key != null) {
      const model = children.get(key);
      return `${key}.${model.textForCell(column, offsetRow)}`;
    }

    return `${column},${offsetRow}`;
  });

  getCachedIsRowExpandable = memoizeClear((children, row, maxDepth) => {
    const depth = this.getCachedDepthForRow(children, row);

    return depth < maxDepth;
  });

  getCachedIsRowExpanded = memoizeClear((children, row) => {
    const { key, offsetRow } = this.getCachedModelRowOffset(children, row);

    if (key != null) {
      const model = children.get(key);
      return model.isRowExpanded(offsetRow);
    }

    return children.has(offsetRow);
  });

  getCachedDepthForRow = memoizeClear((children, row) => {
    const { key, offsetRow } = this.getCachedModelRowOffset(children, row);

    if (key != null) {
      const model = children.get(key);
      return model.depthForRow(offsetRow) + 1;
    }

    return 0;
  });
}

export default MockTreeGridModel;
