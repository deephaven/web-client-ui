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
