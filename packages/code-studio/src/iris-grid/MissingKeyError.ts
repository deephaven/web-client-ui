class MissingKeyError extends Error {
  isMissingKey = true;

  rowIndex: number;

  columnName: string;

  constructor(rowIndex: number, columnName: string) {
    super(`${columnName} can't be empty (on pending row ${rowIndex + 1})`);
    this.rowIndex = rowIndex;
    this.columnName = columnName;
  }
}

export default MissingKeyError;
