import { type GridMetrics } from '@deephaven/grid';
import dh from '@deephaven/jsapi-shim';
import IrisGridTestUtils from './IrisGridTestUtils';
import {
  type HydratedGridState,
  type HydratedIrisGridState,
} from './IrisGridUtils';
import { IrisGridCacheUtils } from './IrisGridCacheUtils';

const irisGridTestUtils = new IrisGridTestUtils(dh);

const gridState = {
  isStuckToBottom: false,
  isStuckToRight: false,
  movedRows: [],
  movedColumns: [],
} satisfies HydratedGridState;

const irisGridState = {
  advancedFilters: new Map(),
  partitionConfig: {
    partitions: [],
    mode: 'merged',
  },
  aggregationSettings: {
    aggregations: [],
    showOnTop: false,
  },
  customColumnFormatMap: new Map(),
  isFilterBarShown: false,
  quickFilters: new Map(),
  customColumns: [],
  reverse: false,
  rollupConfig: {
    columns: [],
    showConstituents: false,
    showNonAggregatedColumns: false,
    includeDescriptions: true,
  },
  showSearchBar: false,
  searchValue: '',
  selectDistinctColumns: [],
  selectedSearchColumns: [],
  sorts: [],
  invertSearchColumns: false,
  pendingDataMap: new Map(),
  frozenColumns: [],
  conditionalFormats: [],
  columnHeaderGroups: [],
  metrics: {
    userColumnWidths: new Map(),
    userRowHeights: new Map(),
  } as GridMetrics,
} satisfies HydratedIrisGridState;

describe('makeMemoizedGridStateDehydrator', () => {
  test('creates a new memoization function with each call', () => {
    const cacheA = IrisGridCacheUtils.makeMemoizedGridStateDehydrator();
    const cacheB = IrisGridCacheUtils.makeMemoizedGridStateDehydrator();
    expect(cacheA).not.toBe(cacheB);
  });

  test('memoizes dehydration', () => {
    const model = irisGridTestUtils.makeModel();

    const dehydrate = IrisGridCacheUtils.makeMemoizedGridStateDehydrator();

    // Same state in different objects
    expect(dehydrate(model, gridState)).toBe(
      dehydrate(model, { ...gridState })
    );

    const differentModel = irisGridTestUtils.makeModel();
    expect(dehydrate(model, gridState)).not.toBe(
      dehydrate(differentModel, gridState)
    );

    const differentState = {
      ...gridState,
      isStuckToBottom: true,
    };
    expect(dehydrate(model, gridState)).not.toBe(
      dehydrate(model, differentState)
    );

    const extraneousState = {
      ...gridState,
      lastLeft: 10,
    };
    expect(dehydrate(model, gridState)).toBe(dehydrate(model, extraneousState));
  });
});

describe('makeMemoizedIrisGridStateDehydrator', () => {
  test('creates a new memoization function with each call', () => {
    const cacheA = IrisGridCacheUtils.makeMemoizedIrisGridStateDehydrator();
    const cacheB = IrisGridCacheUtils.makeMemoizedIrisGridStateDehydrator();
    expect(cacheA).not.toBe(cacheB);
  });

  test('memoizes dehydration', () => {
    const model = irisGridTestUtils.makeModel();

    const dehydrate = IrisGridCacheUtils.makeMemoizedIrisGridStateDehydrator();

    // Same state in different objects
    expect(dehydrate(model, irisGridState)).toBe(
      dehydrate(model, { ...irisGridState })
    );

    const differentModel = irisGridTestUtils.makeModel();
    expect(dehydrate(model, irisGridState)).not.toBe(
      dehydrate(differentModel, irisGridState)
    );

    const differentState = {
      ...irisGridState,
      isFilterBarShown: true,
    };
    expect(dehydrate(model, irisGridState)).not.toBe(
      dehydrate(model, differentState)
    );

    const extraneousState = {
      ...irisGridState,
      lastLeft: 10,
    };
    expect(dehydrate(model, irisGridState)).toBe(
      dehydrate(model, extraneousState)
    );
  });
});

describe('makeMemoizedCombinedGridStateDehydrator', () => {
  test('creates a new memoization function with each call', () => {
    const cacheA = IrisGridCacheUtils.makeMemoizedCombinedGridStateDehydrator();
    const cacheB = IrisGridCacheUtils.makeMemoizedCombinedGridStateDehydrator();
    expect(cacheA).not.toBe(cacheB);
  });
  test('memoizes dehydration', () => {
    const model = irisGridTestUtils.makeModel();

    const dehydrate =
      IrisGridCacheUtils.makeMemoizedCombinedGridStateDehydrator();

    // Same state in different objects
    expect(dehydrate(model, irisGridState, gridState)).toBe(
      dehydrate(model, { ...irisGridState }, { ...gridState })
    );

    const differentModel = irisGridTestUtils.makeModel();
    expect(dehydrate(model, irisGridState, gridState)).not.toBe(
      dehydrate(differentModel, irisGridState, gridState)
    );

    const differentGridState = {
      ...gridState,
      isStuckToBottom: true,
    };
    expect(dehydrate(model, irisGridState, gridState)).not.toBe(
      dehydrate(model, irisGridState, differentGridState)
    );

    const extraneousGridState = {
      ...gridState,
      lastLeft: 10,
    };
    expect(dehydrate(model, irisGridState, gridState)).toBe(
      dehydrate(model, irisGridState, extraneousGridState)
    );

    const differentIrisGridState = {
      ...irisGridState,
      isFilterBarShown: true,
    };
    expect(dehydrate(model, irisGridState, gridState)).not.toBe(
      dehydrate(model, differentIrisGridState, gridState)
    );

    const extraneousIrisGridState = {
      ...irisGridState,
      lastLeft: 10,
    };
    expect(dehydrate(model, irisGridState, gridState)).toBe(
      dehydrate(model, extraneousIrisGridState, gridState)
    );

    expect(dehydrate(model, irisGridState, gridState)).toBe(
      dehydrate(model, extraneousIrisGridState, extraneousGridState)
    );
  });
});
