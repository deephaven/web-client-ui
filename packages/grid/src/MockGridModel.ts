/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import EditableGridModel from './EditableGridModel';
import GridModel from './GridModel';
import GridRange from './GridRange';
import { EditOperation, GridColor, GridTheme, ModelIndex } from './GridTypes';

/**
 * Mock model implementing GridModel for testing out grid functionality
 */
class MockGridModel extends GridModel implements EditableGridModel {
  protected numRows: number;

  protected numColumns: number;

  protected floatingTop: number;

  protected floatingBottom: number;

  protected floatingLeft: number;

  protected floatingRight: number;

  protected editable: boolean;

  protected editedData: string[][];

  constructor({
    rowCount = 1000000000,
    columnCount = 100,
    floatingTopRowCount = 0,
    floatingBottomRowCount = 0,
    floatingLeftColumnCount = 0,
    floatingRightColumnCount = 0,
    isEditable = false,
    editedData = [],
  }: {
    rowCount?: number;
    columnCount?: number;
    floatingTopRowCount?: number;
    floatingBottomRowCount?: number;
    floatingLeftColumnCount?: number;
    floatingRightColumnCount?: number;
    isEditable?: boolean;
    editedData?: string[][];
  } = {}) {
    super();

    this.numRows = rowCount;
    this.numColumns = columnCount;
    this.floatingTop = floatingTopRowCount;
    this.floatingBottom = floatingBottomRowCount;
    this.floatingLeft = floatingLeftColumnCount;
    this.floatingRight = floatingRightColumnCount;
    this.editable = isEditable;
    this.editedData = editedData;
  }

  get rowCount(): number {
    return this.numRows;
  }

  get columnCount(): number {
    return this.numColumns;
  }

  get floatingTopRowCount(): number {
    return this.floatingTop;
  }

  get floatingBottomRowCount(): number {
    return this.floatingBottom;
  }

  get floatingLeftColumnCount(): number {
    return this.floatingLeft;
  }

  get floatingRightColumnCount(): number {
    return this.floatingRight;
  }

  get isEditable(): boolean {
    return this.editable;
  }

  textForCell(column: ModelIndex, row: ModelIndex): string {
    return this.editedData[column]?.[row] ?? `${column},${row}`;
  }

  colorForCell(
    column: ModelIndex,
    row: ModelIndex,
    theme: GridTheme
  ): GridColor {
    return theme.textColor;
  }

  textForColumnHeader(column: ModelIndex, depth = 0): string {
    return `${column}`;
  }

  textForRowHeader(row: ModelIndex): string {
    return `${row}`;
  }

  textForRowFooter(row: ModelIndex): string {
    return `${row}`;
  }

  async setValueForCell(
    column: ModelIndex,
    row: ModelIndex,
    value: string
  ): Promise<void> {
    if (this.editedData[column] == null) {
      this.editedData[column] = [];
    }
    this.editedData[column][row] = `${value}`;
  }

  async setValueForRanges(ranges: GridRange[], text: string): Promise<void> {
    GridRange.forEachCell(ranges, (x, y) => {
      this.setValueForCell(x, y, text);
    });
  }

  async setValues(edits: EditOperation[]): Promise<void> {
    for (let i = 0; i < edits.length; i += 1) {
      const edit = edits[i];
      this.setValueForCell(
        edit.column ?? edit.x,
        edit.row ?? edit.y,
        edit.text
      );
    }
  }

  editValueForCell(column: ModelIndex, row: ModelIndex): string {
    return this.textForCell(column, row);
  }

  isValidForCell(column: ModelIndex, row: ModelIndex, value: string): boolean {
    return true;
  }

  isEditableRange(range: GridRange): boolean {
    return this.isEditable;
  }

  delete(ranges: GridRange[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export default MockGridModel;
