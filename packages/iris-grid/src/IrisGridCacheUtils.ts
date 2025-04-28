/* eslint-disable import/prefer-default-export */
import { type GridState } from '@deephaven/grid';
import memoizeOne from 'memoize-one';
import type IrisGridModel from './IrisGridModel';
import IrisGridUtils, {
  type DehydratedGridState,
  type DehydratedIrisGridState,
  type HydratedGridState,
  type HydratedIrisGridState,
} from './IrisGridUtils';

/**
 * Checks if 2 grid states are equivalent.
 * Checks values and does not require referential equality of the entire state, just the values we care about.
 * @param gridStateA First grid state
 * @param gridStateB Second grid state
 * @returns True if the states are equivalent
 */
function areGridStatesEqual(
  gridStateA: HydratedGridState,
  gridStateB: HydratedGridState
): boolean {
  const compareKeys = [
    'isStuckToBottom',
    'isStuckToRight',
    'movedColumns',
    'movedRows',
  ] satisfies Array<keyof GridState>;
  return (
    gridStateA === gridStateB ||
    compareKeys.every(key => gridStateA[key] === gridStateB[key])
  );
}

/**
 * Checks if 2 iris grid states are equivalent.
 * Checks values and does not require referential equality of the entire state, just the values we care about.
 * @param irisGridStateA First iris grid state
 * @param irisGridStateB Second iris grid state
 * @returns True if the states are equivalent
 */
function areIrisGridStatesEqual(
  irisGridStateA: HydratedIrisGridState,
  irisGridStateB: HydratedIrisGridState
): boolean {
  // Top level keys we want to check for referential equality
  const compareStateKeys = [
    'advancedFilters',
    'aggregationSettings',
    'customColumnFormatMap',
    'isFilterBarShown',
    'quickFilters',
    'customColumns',
    'reverse',
    'rollupConfig',
    'showSearchBar',
    'searchValue',
    'selectDistinctColumns',
    'selectedSearchColumns',
    'sorts',
    'invertSearchColumns',
    'pendingDataMap',
    'frozenColumns',
    'conditionalFormats',
    'columnHeaderGroups',
    'partitionConfig',
  ] satisfies Array<keyof HydratedIrisGridState>;

  return (
    irisGridStateA === irisGridStateB ||
    (irisGridStateA.metrics != null &&
      irisGridStateB.metrics != null &&
      irisGridStateA.metrics.userColumnWidths ===
        irisGridStateB.metrics.userColumnWidths &&
      irisGridStateA.metrics.userRowHeights ===
        irisGridStateB.metrics.userRowHeights &&
      compareStateKeys.every(
        key => irisGridStateA[key] === irisGridStateB[key]
      ))
  );
}

/**
 * Creates a dehydrator function for grid state that is memoized on the last call.
 * Only tracks 1 state at a time. If the model and input states are equal, returns the same dehydrated state object reference.
 * @returns A dehydrator function memoized on the last call
 */
function makeMemoizedGridStateDehydrator(): (
  model: IrisGridModel,
  gridState: HydratedGridState
) => DehydratedGridState {
  return memoizeOne(
    (model: IrisGridModel, gridState: HydratedGridState) =>
      IrisGridUtils.dehydrateGridState(model, gridState),
    ([modelA, gridStateA], [modelB, gridStateB]) =>
      modelA === modelB && areGridStatesEqual(gridStateA, gridStateB)
  );
}

/**
 * Creates a dehydrator function for iris grid state that is memoized on the last call.
 * Only tracks 1 state at a time. If the model and input states are equal, returns the same dehydrated state object reference.
 * @returns A dehydrator function memoized on the last call
 */
function makeMemoizedIrisGridStateDehydrator(): (
  model: IrisGridModel,
  irisGridState: HydratedIrisGridState
) => DehydratedIrisGridState {
  return memoizeOne(
    (model: IrisGridModel, irisGridState: HydratedIrisGridState) => {
      const irisGridUtils = new IrisGridUtils(model.dh);
      return irisGridUtils.dehydrateIrisGridState(model, irisGridState);
    },
    ([modelA, irisGridStateA], [modelB, irisGridStateB]) =>
      modelA === modelB &&
      areIrisGridStatesEqual(irisGridStateA, irisGridStateB)
  );
}

/**
 * Creates a dehydrator function for grid and iris grid state that is memoized on the last call.
 * Only tracks 1 state at a time. If the model and input states are equal, returns the same dehydrated state object reference.
 * Combines the dehydrated grid and iris grid states into a single object.
 * @returns A dehydrator function memoized on the last call
 */
function makeMemoizedCombinedGridStateDehydrator(): (
  model: IrisGridModel,
  irisGridState: HydratedIrisGridState,
  gridState: HydratedGridState
) => DehydratedIrisGridState & DehydratedGridState {
  return memoizeOne(
    (
      model: IrisGridModel,
      irisGridState: HydratedIrisGridState,
      gridState: HydratedGridState
    ): DehydratedIrisGridState & DehydratedGridState => {
      const irisGridUtils = new IrisGridUtils(model.dh);
      return {
        ...irisGridUtils.dehydrateIrisGridState(model, irisGridState),
        ...IrisGridUtils.dehydrateGridState(model, gridState),
      };
    },
    (
      [modelA, irisGridStateA, gridStateA],
      [modelB, irisGridStateB, gridStateB]
    ) =>
      modelA === modelB &&
      areIrisGridStatesEqual(irisGridStateA, irisGridStateB) &&
      areGridStatesEqual(gridStateA, gridStateB)
  );
}

export const IrisGridCacheUtils = {
  makeMemoizedGridStateDehydrator,
  makeMemoizedIrisGridStateDehydrator,
  makeMemoizedCombinedGridStateDehydrator,
};
