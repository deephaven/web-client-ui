import { act, renderHook } from '@testing-library/react-hooks';
import type { DebouncedFunc } from 'lodash';
import { TABLE_ROW_HEIGHT } from '@deephaven/components';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  createSearchTextFilter,
  type FilterConditionFactory,
  type TableUtils,
} from '@deephaven/jsapi-utils';
import { useDebouncedCallback } from '@deephaven/react-hooks';
import { TestUtils } from '@deephaven/test-utils';
import useSearchableViewportData from './useSearchableViewportData';
import useViewportData, { type UseViewportDataResult } from './useViewportData';
import useTableUtils from './useTableUtils';
import useFilterConditionFactories from './useFilterConditionFactories';
import useViewportFilter from './useViewportFilter';
import {
  SEARCH_DEBOUNCE_MS,
  VIEWPORT_PADDING,
  VIEWPORT_SIZE,
} from './Constants';

const { asMock, createMockProxy } = TestUtils;

jest.mock('@deephaven/jsapi-utils', () => ({
  ...jest.requireActual('@deephaven/jsapi-utils'),
  createSearchTextFilter: jest.fn(),
}));
jest.mock('./useFilterConditionFactories');
jest.mock('./useTableUtils');
jest.mock('./useViewportData');
jest.mock('./useViewportFilter');
jest.mock('@deephaven/react-hooks', () => ({
  ...jest.requireActual('@deephaven/react-hooks'),
  useDebouncedCallback: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('useSearchableViewportData: %s', () => {
  type SearchTextChangeHandler = DebouncedFunc<(value: string) => void>;

  const table = createMockProxy<DhType.Table>();
  const searchColumnNames = ['Aaa', 'Bbb', 'Ccc'];
  const additionalFilterConditionFactories = [
    jest.fn(),
    jest.fn(),
  ] as FilterConditionFactory[];

  const mockTimeZone = 'mock.timeZone';

  const mockResult = {
    createSearchTextFilter: jest.fn() as FilterConditionFactory,
    useDebouncedCallback: jest.fn() as unknown as SearchTextChangeHandler,
    useFilterConditionFactories: [] as DhType.FilterCondition[],
    useTableUtils: createMockProxy<TableUtils>(),
    useViewportData: createMockProxy<
      UseViewportDataResult<unknown, DhType.Table>
    >({
      table,
    }),
  };

  // Mock implementation of useDebouncedCallback that allows us to spy on the
  // returned function while still calling the original given callback.
  const useDebouncedCallbackImpl = (
    cb: (value: string) => void
  ): SearchTextChangeHandler => {
    asMock(mockResult.useDebouncedCallback).mockImplementation(cb);

    return mockResult.useDebouncedCallback;
  };

  beforeEach(() => {
    asMock(useTableUtils)
      .mockName('useTableUtils')
      .mockReturnValue(mockResult.useTableUtils);

    asMock(useDebouncedCallback)
      .mockName('useDebouncedCallback')
      .mockImplementation(useDebouncedCallbackImpl);

    asMock(useViewportData)
      .mockName('useViewportData')
      .mockReturnValue(
        mockResult.useViewportData as UseViewportDataResult<
          unknown,
          DhType.Table
        >
      );

    asMock(createSearchTextFilter)
      .mockName('createSearchTextFilter')
      .mockReturnValue(mockResult.createSearchTextFilter);

    asMock(useFilterConditionFactories)
      .mockName('useFilterConditionFactories')
      .mockReturnValue(mockResult.useFilterConditionFactories);
  });

  it('should create windowed viewport for list data', () => {
    const { result } = renderHook(() =>
      useSearchableViewportData({
        table,
        searchColumnNames,
        additionalFilterConditionFactories,
        timeZone: mockTimeZone,
      })
    );

    expect(useViewportData).toHaveBeenCalledWith({
      table,
      itemHeight: TABLE_ROW_HEIGHT,
      viewportSize: VIEWPORT_SIZE,
      viewportPadding: VIEWPORT_PADDING,
    });

    expect(useDebouncedCallback).toHaveBeenCalledWith(
      expect.any(Function),
      SEARCH_DEBOUNCE_MS
    );

    expect(result.current).toEqual({
      ...mockResult.useViewportData,
      onSearchTextChange: mockResult.useDebouncedCallback,
    });
  });

  it('should filter data based on search text', () => {
    const { result } = renderHook(() =>
      useSearchableViewportData({
        table,
        searchColumnNames,
        additionalFilterConditionFactories,
        timeZone: mockTimeZone,
      })
    );

    const testCommon = (expectedSearchText: string) => {
      expect(createSearchTextFilter).toHaveBeenCalledWith(
        mockResult.useTableUtils,
        searchColumnNames,
        expectedSearchText,
        mockTimeZone
      );

      expect(useFilterConditionFactories).toHaveBeenCalledWith(
        mockResult.useViewportData.table,
        mockResult.createSearchTextFilter,
        ...additionalFilterConditionFactories
      );

      expect(useViewportFilter).toHaveBeenCalledWith(
        mockResult.useViewportData,
        mockResult.useFilterConditionFactories
      );
    };

    testCommon('');

    jest.clearAllMocks();

    const searchText = 'mock.searchText';

    act(() => {
      result.current.onSearchTextChange(searchText);
    });

    testCommon(searchText);
  });
});
