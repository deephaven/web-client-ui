import { act, renderHook } from '@testing-library/react-hooks';
import type { DebouncedFunc } from 'lodash';
import type { FilterCondition, Table } from '@deephaven/jsapi-types';
import {
  createSearchTextFilter,
  FilterConditionFactory,
  TableUtils,
} from '@deephaven/jsapi-utils';
import { useDebouncedCallback } from '@deephaven/react-hooks';
import {
  SEARCH_DEBOUNCE_MS,
  TABLE_ROW_HEIGHT,
  TestUtils,
  VIEWPORT_PADDING,
  VIEWPORT_SIZE,
} from '@deephaven/utils';
import useSearchableViewportData from './useSearchableViewportData';
import useViewportData, { UseViewportDataResult } from './useViewportData';
import useTableUtils from './useTableUtils';
import useFilterConditionFactories from './useFilterConditionFactories';
import useViewportFilter from './useViewportFilter';

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

  const table = createMockProxy<Table>();
  const columnNames = ['Aaa', 'Bbb', 'Ccc'];
  const additionalFilterConditionFactories = [
    jest.fn(),
    jest.fn(),
  ] as FilterConditionFactory[];

  const mockResult = {
    createSearchTextFilter: jest.fn() as FilterConditionFactory,
    useDebouncedCallback: jest.fn() as unknown as SearchTextChangeHandler,
    useFilterConditionFactories: [] as FilterCondition[],
    useTableUtils: createMockProxy<TableUtils>(),
    useViewportData: createMockProxy<UseViewportDataResult<unknown, Table>>({
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
        mockResult.useViewportData as UseViewportDataResult<unknown, Table>
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
      useSearchableViewportData(
        table,
        columnNames,
        ...additionalFilterConditionFactories
      )
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
      list: mockResult.useViewportData,
      onSearchTextChange: mockResult.useDebouncedCallback,
    });
  });

  it('should filter data based on search text', () => {
    const { result } = renderHook(() =>
      useSearchableViewportData(
        table,
        columnNames,
        ...additionalFilterConditionFactories
      )
    );

    const testCommon = (expectedSearchText: string) => {
      expect(createSearchTextFilter).toHaveBeenCalledWith(
        mockResult.useTableUtils,
        columnNames,
        expectedSearchText
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
