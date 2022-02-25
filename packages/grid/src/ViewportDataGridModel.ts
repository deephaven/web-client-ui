/* eslint-disable class-methods-use-this */
import GridModel from './GridModel';

/**
 * A simple model that displays a viewport of data
 */
class ViewportDataGridModel extends GridModel {
  private numberOfColumns: number;

  private numberOfRows: number;

  public viewportData?: {
    rowOffset: number;
    columnOffset: number;
    data: unknown[][];
  };

  /**
   * Model for fetching data asynchonously. Set the viewported data when data is fetched.
   * @param columnCount Number of columns
   * @param rowCount Number of rows
   */
  constructor(columnCount: number, rowCount: number) {
    super();

    this.numberOfColumns = columnCount;
    this.numberOfRows = rowCount;
  }

  get columnCount(): number {
    return this.numberOfColumns;
  }

  get rowCount(): number {
    return this.numberOfRows;
  }

  textForCell(column: number, row: number): string {
    const viewportRow = row - (this.viewportData?.rowOffset ?? 0);
    const viewportColumn = column - (this.viewportData?.columnOffset ?? 0);
    return `${this.viewportData?.data[viewportRow]?.[viewportColumn] ?? ''}`;
  }

  textForColumnHeader(column: number): string {
    return `${column}`;
  }

  textForRowHeader(row: number): string {
    return `${row}`;
  }
}

export default ViewportDataGridModel;
