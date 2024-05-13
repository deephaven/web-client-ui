import GridRange from './GridRange';
import GridModel from './GridModel';
import { AssertionError } from './errors';

export function isDeletableGridModel(
  model: GridModel
): model is DeletableGridModel {
  return (model as DeletableGridModel)?.isDeletable !== undefined;
}

export function assertIsDeletableGridModel(
  model: GridModel
): asserts model is DeletableGridModel {
  if (!isDeletableGridModel(model)) {
    throw new AssertionError(
      `Expected 'model' to be deletable, but received ${model}`
    );
  }
}

/**
 * Model for a deletable grid
 */
export interface DeletableGridModel extends GridModel {
  /** Whether this model is deletable or not */
  isDeletable: boolean;

  /**
   * Check if a given range is deletable
   * @param range The range to check if it is deletable
   * @returns True if the range is deletable
   */
  isDeletableRange: (range: GridRange) => boolean;

  /**
   * Check if an array of ranges are deletable
   * @param ranges The ranges to check if they are deletable
   * @returns True if the ranges are deletable
   */
  isDeletableRanges: (ranges: readonly GridRange[]) => boolean;

  /**
   * Delete ranges from an input grid.
   * @param ranges The ranges to delete
   * @returns A promise that resolves successfully when the operation is complete or rejects if there's an error
   */
  delete: (ranges: readonly GridRange[]) => Promise<void>;
}

export default DeletableGridModel;
