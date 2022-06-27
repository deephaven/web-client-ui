import { ModelIndex } from '@deephaven/grid';
import { ColumnName } from './CommonTypes';

class MissingKeyError extends Error {
  isMissingKey = true;

  rowIndex: ModelIndex;

  columnName: ColumnName;

  constructor(rowIndex: ModelIndex, columnName: ColumnName) {
    super(`${columnName} can't be empty (on pending row ${rowIndex + 1})`);
    this.rowIndex = rowIndex;
    this.columnName = columnName;
  }
}

export default MissingKeyError;
