import GridRange from './GridRange';
import { ModelIndex } from './GridMetrics';
import GridModel from './GridModel';
import { AssertionError } from './errors';

export function isEditableGridModel(
  model: GridModel
): model is EditableGridModel {
  return (model as EditableGridModel)?.isEditable !== undefined;
}

export function assertIsEditableGridModel(
  model: GridModel
): asserts model is EditableGridModel {
  if (!isEditableGridModel(model)) {
    throw new AssertionError(
      `Expected 'model' to be editable, but received ${model}`
    );
  }
}

/**
 * Edit operation when applying multiple edits
 */
export type EditOperation = {
  /** Column to set the value for */
  column: ModelIndex;

  /** Row to set the value for */
  row: ModelIndex;

  /** Text value to set */
  text: string;

  /** @deprecated use `column` instead */
  x?: ModelIndex;
  /** @deprecated use `row` instead */
  y?: ModelIndex;
};

/**
 * Model for an editable grid
 */
export interface EditableGridModel extends GridModel {
  isEditable: boolean;

  /**
   * Check if a given range is editable
   * @param range The range to check if it is editable
   * @returns True if the range is editable
   */
  isEditableRange(range: GridRange): boolean;

  /**
   * Get the edit text for a cell as a string
   * @param column Column to get
   * @param row Row to get
   * @returns The value to use for editing
   */
  editValueForCell(column: ModelIndex, row: ModelIndex): string;

  /**
   * Set value in an editable table
   * @param column Column to set
   * @param row Row to set
   * @param value The value to set
   * @returns A promise that resolves successfully when the operation is complete, or rejects if there's an error
   */
  setValueForCell(
    column: ModelIndex,
    row: ModelIndex,
    value: string
  ): Promise<void>;

  /**
   * Set value in an editable table
   * @param ranges The ranges to set
   * @param value The value to set
   * @returns A promise that resolves successfully when the operation is complete, or rejects if there's an error
   */
  setValueForRanges(ranges: GridRange[], value: string): Promise<void>;

  /**
   * Apply edits to the model
   * @param edits Edits to apply to the model
   * @returns A promise that resolves successfully when the operation is complete or rejects if there's an error
   */
  setValues(edits: EditOperation[]): Promise<void>;

  /**
   * Check if a text value is a valid edit for a cell
   * @param column Column to check
   * @param row Row to check
   * @param value Value to check if it's a valid value or not
   * @returns True if it's a valid value, false otherwise
   */
  isValidForCell(column: ModelIndex, row: ModelIndex, value: string): boolean;
}

export default EditableGridModel;
