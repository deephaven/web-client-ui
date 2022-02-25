import GridModel from './GridModel';

/**
 * A simple model that displays static data
 */
class StaticDataGridModel extends GridModel {
  private data: unknown[][];

  private columnHeaders?: string[];

  private numberOfColumns: number;

  /**
   * Create a model using the static data provided
   * @param data Row data to display. First dimension is the number of rows, second dimension is the value for each column. Row/column count is derived from the data, and it is stringified for display.
   * @param columnHeaders Optional names for the column headers
   */
  constructor(data: unknown[][], columnHeaders?: string[]) {
    super();

    this.data = data;
    this.numberOfColumns = Math.max(
      ...data.map(row => row.length),
      columnHeaders?.length ?? 0
    );
    this.columnHeaders = columnHeaders;
  }

  get rowCount(): number {
    return this.data.length;
  }

  get columnCount(): number {
    return this.numberOfColumns;
  }

  textForCell(column: number, row: number): string {
    return `${this.data[row]?.[column]}`;
  }

  textForColumnHeader(column: number): string {
    return this.columnHeaders?.[column] ?? '';
  }
}

export default StaticDataGridModel;
