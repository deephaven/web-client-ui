import { renderHook } from '@testing-library/react-hooks';
import {
  Column,
  FilterCondition,
  FilterValue,
  Table,
} from '@deephaven/jsapi-shim';
import { TableUtils } from '@deephaven/jsapi-utils';
import { TestUtils } from '@deephaven/utils';
import useDebouncedViewportSearch from './useDebouncedViewportSearch';
import { UseViewportDataResult } from './useViewportData';

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

  (column.filter as jest.Mock).mockReturnValue(columnFilterValue);
  (columnFilterValue.contains as jest.Mock).mockReturnValue(filterCondition);
  (table.findColumn as jest.Mock).mockReturnValue(column);

  jest.spyOn(TableUtils, 'makeFilterValue').mockReturnValue(matchFilterValue);
});

it('should return a funciton that debounces search filtering', () => {
  const searchText = 'mock.searchText';
  const debounceMs = 400;

  const { result } = renderHook(() =>
    useDebouncedViewportSearch(viewportData, 'mock.column', debounceMs)
  );

  result.current(searchText);

  expect(viewportData.applyFiltersAndRefresh).not.toHaveBeenCalled();

  jest.advanceTimersByTime(debounceMs);

  expect(TableUtils.makeFilterValue).toHaveBeenCalledWith(
    column.type,
    searchText
  );
  expect(viewportData.applyFiltersAndRefresh).toHaveBeenCalledWith([
    filterCondition,
  ]);
});

it('should trim search text', () => {
  const searchText = '    mock.searchText    ';
  const trimmedSearchText = 'mock.searchText';
  const debounceMs = 400;

  const { result } = renderHook(() =>
    useDebouncedViewportSearch(viewportData, 'mock.column', debounceMs)
  );

  result.current(searchText);
  jest.advanceTimersByTime(debounceMs);

  expect(TableUtils.makeFilterValue).toHaveBeenCalledWith(
    column.type,
    trimmedSearchText
  );
});

it.each(['', '    '])(
  'should pass apply empty filter if search text is empty',
  searchText => {
    const debounceMs = 400;

    const { result } = renderHook(() =>
      useDebouncedViewportSearch(viewportData, 'mock.column', debounceMs)
    );

    result.current(searchText);
    jest.advanceTimersByTime(debounceMs);

    expect(TableUtils.makeFilterValue).not.toHaveBeenCalled();
    expect(viewportData.applyFiltersAndRefresh).toHaveBeenCalledWith([]);
  }
);
