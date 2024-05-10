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
 * Model for an deletable grid
 */
export interface DeletableGridModel extends GridModel {
  isDeletable: boolean;

  /**
   * Check if a given range is deletable
   * @param range The range to check if it is deletable
   * @returns True if the range is deletable
   */
  isDeletableRange: (range: GridRange) => boolean;

  /**
   * Check if an array of ranges is deletable
   * @param ranges The ranges to check if they are deletable
   * @returns True if the ranges is deletable
   */
  isDeletableRanges: (ranges: readonly GridRange[]) => boolean;
}

export default DeletableGridModel;
