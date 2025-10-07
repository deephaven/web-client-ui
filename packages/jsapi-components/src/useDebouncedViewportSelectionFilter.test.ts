import { renderHook } from '@testing-library/react';
import {
  createKeyedItemKey,
  createSelectedValuesFilter,
  type FilterConditionFactory,
  type TableUtils,
} from '@deephaven/jsapi-utils';
import {
  isSelectionMaybeInvertedEqual,
  useDebouncedValue,
  useIsEqualMemo,
  useMappedSelection,
  type WindowedListData,
} from '@deephaven/react-hooks';
import { type KeyedItem } from '@deephaven/utils';
import { TestUtils } from '@deephaven/test-utils';
import useDebouncedViewportSelectionFilter, {
  DEBOUNCE_MS,
} from './useDebouncedViewportSelectionFilter';
import useTableUtils from './useTableUtils';

jest.mock('@deephaven/react-hooks');
jest.mock('@deephaven/jsapi-utils', () => ({
  ...jest.requireActual('@deephaven/jsapi-utils'),
  createSelectedValuesFilter: jest.fn(),
}));
jest.mock('./useTableUtils');

const { asMock, createMockProxy } = TestUtils;

const mockFilterConditionFactory: FilterConditionFactory = jest.fn();

const mockViewportData =
  createMockProxy<WindowedListData<KeyedItem<unknown>>>();

const mockSelection = {
  useDebounceValueResult: {
    isDebouncing: false,
    value: { selection: new Set('a'), isInverted: true },
  },
  useIsEqualMemoResult: { selection: new Set('b'), isInverted: true },
  useMappedSelectionResult: { selection: new Set('c'), isInverted: true },
} as const;

const mockTableUtils = createMockProxy<TableUtils>();

const columnName = 'mock.column';
const shouldSelectAllOnNoSelection = true;
const mapItemToValue = jest.fn();

const options = {
  viewportData: mockViewportData,
  columnName,
  shouldSelectAllOnNoSelection,
  mapItemToValue,
};

beforeEach(() => {
  jest.clearAllMocks();

  asMock(createSelectedValuesFilter)
    .mockName('createSelectedValuesFilter')
    .mockReturnValue(mockFilterConditionFactory);

  asMock(useDebouncedValue)
    .mockName('useDebouncedValue')
    .mockReturnValue(mockSelection.useDebounceValueResult);

  asMock(useIsEqualMemo)
    .mockName('useIsEqualMemo')
    .mockReturnValue(mockSelection.useIsEqualMemoResult);

  asMock(useMappedSelection)
    .mockName('useMappedSelection')
    .mockReturnValue(mockSelection.useMappedSelectionResult);

  asMock(useTableUtils)
    .mockName('useTableUtils')
    .mockReturnValue(mockTableUtils);
});

it('should map selection to values', () => {
  renderHook(() => useDebouncedViewportSelectionFilter(options));

  expect(useMappedSelection).toHaveBeenCalledWith(
    mockViewportData,
    mapItemToValue,
    createKeyedItemKey
  );
});

it('should debounce mapped values', () => {
  renderHook(() => useDebouncedViewportSelectionFilter(options));

  expect(useDebouncedValue).toHaveBeenCalledWith(
    mockSelection.useMappedSelectionResult,
    DEBOUNCE_MS
  );
});

it('should memoize debounced selection based on value equality', () => {
  renderHook(() => useDebouncedViewportSelectionFilter(options));

  expect(useIsEqualMemo).toHaveBeenCalledWith(
    mockSelection.useDebounceValueResult.value,
    isSelectionMaybeInvertedEqual
  );
});

it('should create memoized selected values filter', () => {
  const { result, rerender } = renderHook(
    opt => useDebouncedViewportSelectionFilter(opt),
    { initialProps: options }
  );

  expect(createSelectedValuesFilter).toHaveBeenCalledWith(
    asMock(useTableUtils).mock.results[0].value,
    columnName,
    mockSelection.useIsEqualMemoResult.selection,
    shouldSelectAllOnNoSelection,
    mockSelection.useIsEqualMemoResult.isInverted
  );

  expect(result.current).toBe(mockFilterConditionFactory);
  jest.clearAllMocks();

  // memoized
  rerender(options);
  expect(createSelectedValuesFilter).not.toHaveBeenCalled();
  jest.clearAllMocks();

  // memo change
  rerender({ ...options, shouldSelectAllOnNoSelection: false });

  expect(createSelectedValuesFilter).toHaveBeenCalledWith(
    asMock(useTableUtils).mock.results[0].value,
    columnName,
    mockSelection.useIsEqualMemoResult.selection,
    false,
    mockSelection.useIsEqualMemoResult.isInverted
  );
});
