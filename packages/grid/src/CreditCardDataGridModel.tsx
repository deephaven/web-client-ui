import GridModel from './GridModel';
import type { CellRenderType } from './CellRenderer';
import type { DataBarOptions } from './DataBarGridModel';
import type { ModelIndex } from './GridMetrics';
import type { GridTheme } from './GridTheme';

/**
 * A simple model that displays credit card data
 */

class CreditCardDataGridModel extends GridModel {
  private data: unknown[][];

  private columnHeaders?: string[];

  private numberOfColumns: number;

  private pcaColumns: number[] = [];

  constructor(data: unknown[][], columnHeaders?: string[]) {
    super();

    this.data = data;
    this.numberOfColumns = Math.max(
      ...data.map(row => row.length),
      columnHeaders?.length ?? 0
    );
    this.columnHeaders = columnHeaders;
    this.pcaColumns = columnHeaders
      ? columnHeaders.reduce((acc: number[], header, index) => {
          if (header.startsWith('V')) {
            acc.push(index);
          }
          return acc;
        }, [])
      : [];
  }

  get rowCount(): number {
    return this.data.length;
  }

  get columnCount(): number {
    return this.numberOfColumns;
  }

  get pcaColumnCount(): number {
    return this.pcaColumns.length;
  }

  get pcaColumnIndices(): number[] {
    return this.pcaColumns;
  }

  textForCell(column: number, row: number): string {
    return `${this.data[row]?.[column]}`;
  }

  textForColumnHeader(column: number): string {
    return this.columnHeaders?.[column] ?? '';
  }

  renderTypeForCell(column: ModelIndex, row: ModelIndex): CellRenderType {
    if (this.pcaColumns.includes(column)) {
      return 'dataBar';
    }
    return 'text';
  }

  dataBarOptionsForCell(
    column: ModelIndex,
    row: ModelIndex,
    theme: GridTheme
  ): DataBarOptions | undefined {
    if (this.pcaColumns.includes(column)) {
      const value = parseFloat(this.textForCell(column, row));
      if (Number.isNaN(value)) {
        return undefined;
      }
      const min = Math.min(
        ...this.data.map(rowData => parseFloat(rowData[column] as string))
      );
      const max = Math.max(
        ...this.data.map(rowData => parseFloat(rowData[column] as string))
      );
      return {
        columnMin: min,
        columnMax: max,
        axis: 'proportional',
        color: value >= 0 ? theme.positiveBarColor : theme.negativeBarColor,
        valuePlacement: 'overlap',
        opacity: 0.2,
        markers: [],
        direction: 'LTR',
        value,
      } as DataBarOptions;
    }
    return undefined;
  }
}

export default CreditCardDataGridModel;
