import { renderHook } from '@testing-library/react-hooks';
import { makeApiContextWrapper } from '@deephaven/jsapi-components';
import type {
  Column,
  FilterCondition,
  FilterValue,
  Table,
} from '@deephaven/jsapi-types';
import dh from '@deephaven/jsapi-shim';
import { TableUtils } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import useDebouncedViewportSearch, {
  DEBOUNCE_VIEWPORT_SEARCH_MS,
} from './useDebouncedViewportSearch';
import { UseViewportDataResult } from './useViewportData';

const tableUtils = new TableUtils(dh);

const wrapper = makeApiContextWrapper(dh);

// Mock js api objects
const column = TestUtils.createMockProxy<Column>({
  type: 'java.lang.String',
});
const filterCondition = TestUtils.createMockProxy<FilterCondition>({});
const columnFilterValue = TestUtils.createMockProxy<FilterValue>({});
const matchFilterValue = TestUtils.createMockProxy<FilterValue>({});
const table = TestUtils.createMockProxy<Table>({});
const viewportData = TestUtils.createMockProxy<
  UseViewportDataResult<unknown, Table>
>({ table });

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  TestUtils.asMock(column.filter).mockReturnValue(columnFilterValue);
  TestUtils.asMock(columnFilterValue.contains).mockReturnValue(filterCondition);
  TestUtils.asMock(table.findColumn).mockReturnValue(column);

  jest
    .spyOn(TableUtils.prototype, 'makeFilterValue')
    .mockReturnValue(matchFilterValue);
});

it.each([undefined, 400])(
  'should return a function that debounces search filtering',
  debounceMs => {
    const searchText = 'mock.searchText';

    const { result } = renderHook(
      () => useDebouncedViewportSearch(viewportData, 'mock.column', debounceMs),
      { wrapper }
    );

    result.current(searchText);

    expect(viewportData.applyFiltersAndRefresh).not.toHaveBeenCalled();

    jest.advanceTimersByTime(debounceMs ?? DEBOUNCE_VIEWPORT_SEARCH_MS);

    expect(tableUtils.makeFilterValue).toHaveBeenCalledWith(
      column.type,
      searchText
    );
    expect(viewportData.applyFiltersAndRefresh).toHaveBeenCalledWith([
      filterCondition,
    ]);
  }
);

it('should return a function that safely ignores no table', () => {
  const viewportNoTable = TestUtils.createMockProxy<
    UseViewportDataResult<unknown, Table>
  >({ table: null });

  const searchText = 'mock.searchText';
  const debounceMs = 400;

  const { result } = renderHook(
    () =>
      useDebouncedViewportSearch(viewportNoTable, 'mock.column', debounceMs),
    { wrapper }
  );

  result.current(searchText);
  jest.advanceTimersByTime(debounceMs);

  expect(tableUtils.makeFilterValue).not.toHaveBeenCalled();
  expect(viewportNoTable.applyFiltersAndRefresh).not.toHaveBeenCalled();
});

it('should trim search text', () => {
  const searchText = '    mock.searchText    ';
  const trimmedSearchText = 'mock.searchText';
  const debounceMs = 400;

  const { result } = renderHook(
    () => useDebouncedViewportSearch(viewportData, 'mock.column', debounceMs),
    { wrapper }
  );

  result.current(searchText);
  jest.advanceTimersByTime(debounceMs);

  expect(tableUtils.makeFilterValue).toHaveBeenCalledWith(
    column.type,
    trimmedSearchText
  );
});

it.each(['', '    '])(
  'should pass apply empty filter if search text is empty',
  searchText => {
    const debounceMs = 400;

    const { result } = renderHook(
      () => useDebouncedViewportSearch(viewportData, 'mock.column', debounceMs),
      { wrapper }
    );

    result.current(searchText);
    jest.advanceTimersByTime(debounceMs);

    expect(tableUtils.makeFilterValue).not.toHaveBeenCalled();
    expect(viewportData.applyFiltersAndRefresh).toHaveBeenCalledWith([]);
  }
);

it('should cancel debounce on unmount', () => {
  const searchText = 'mock.searchText';
  const debounceMs = 400;

  const { result, unmount } = renderHook(
    () => useDebouncedViewportSearch(viewportData, 'mock.column', debounceMs),
    { wrapper }
  );

  result.current(searchText);
  jest.advanceTimersByTime(5);
  unmount();
  jest.advanceTimersByTime(debounceMs);

  expect(tableUtils.makeFilterValue).not.toHaveBeenCalled();
  expect(viewportData.applyFiltersAndRefresh).not.toHaveBeenCalled();
});
