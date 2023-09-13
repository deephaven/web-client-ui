import { act, renderHook } from '@testing-library/react-hooks';
import type { FilterCondition, Table } from '@deephaven/jsapi-types';
import {
  createSearchTextFilter,
  createSelectedValuesFilter,
  FilterConditionFactory,
  TableUtils,
} from '@deephaven/jsapi-utils';
import {
  KeyedItem,
  SEARCH_DEBOUNCE_MS,
  TestUtils,
  WindowedListData,
} from '@deephaven/utils';
import usePickerWithSelectedValues from './usePickerWithSelectedValues';
import useViewportData, { UseViewportDataResult } from './useViewportData';
import useViewportFilter from './useViewportFilter';
import useFilterConditionFactories from './useFilterConditionFactories';
import useTableUtils from './useTableUtils';

jest.mock('./useFilterConditionFactories');
jest.mock('./useTableUtils');
jest.mock('./useViewportData');
jest.mock('./useViewportFilter');
jest.mock('@deephaven/jsapi-utils', () => ({
  ...jest.requireActual('@deephaven/jsapi-utils'),
  createSearchTextFilter: jest.fn(),
  createSelectedValuesFilter: jest.fn(),
}));

const { asMock, createMockProxy } = TestUtils;

interface MockItem {
  type: 'mock.item';
}

const tableUtils = createMockProxy<TableUtils>();

const mock = {
  columnName: 'mock.columnName',
  filter: [
    createMockProxy<FilterCondition>(),
    createMockProxy<FilterCondition>(),
  ],
  filterConditionFactories: [jest.fn(), jest.fn()] as FilterConditionFactory[],
  keyedItem: createMockProxy<KeyedItem<MockItem>>({
    key: 'mock.key',
    item: { type: 'mock.item' },
  }),
  mapItemToValue: jest.fn<string, [item: KeyedItem<MockItem>]>(),
  searchText: 'mock.searchText',
  searchTextFilter: jest.fn() as FilterConditionFactory,
  selectedKey: 'mock.selectedKey',
  excludeSelectedValuesFilter: jest.fn() as FilterConditionFactory,
  value: 'mock.value',
  viewportData: createMockProxy<WindowedListData<KeyedItem<MockItem>>>(),
};

const mockTable = {
  usersAndGroups: createMockProxy<Table>(),
  list: createMockProxy<Table>(),
};

function mockUseViewportData(size: number) {
  const viewportData = createMockProxy<UseViewportDataResult<MockItem, Table>>({
    table: mockTable.list,
    viewportData: mock.viewportData,
    size,
  });

  asMock(useViewportData)
    .mockName('useViewportData')
    .mockReturnValue(viewportData as UseViewportDataResult<unknown, Table>);
}

async function renderOnceAndWait() {
  const hookResult = renderHook(() =>
    usePickerWithSelectedValues(
      mockTable.usersAndGroups,
      mock.columnName,
      mock.mapItemToValue,
      ...mock.filterConditionFactories
    )
  );

  await hookResult.waitForNextUpdate();

  return hookResult;
}

beforeEach(() => {
  jest.clearAllMocks();

  asMock(useTableUtils).mockName('useTableUtils').mockReturnValue(tableUtils);

  asMock(mock.mapItemToValue)
    .mockName('mockItemToValue')
    .mockReturnValue(mock.value);

  asMock(tableUtils.createDistinctSortedColumnTable).mockResolvedValue(
    mockTable.list
  );

  asMock(createSearchTextFilter)
    .mockName('createSearchTextFilter')
    .mockReturnValue(mock.searchTextFilter);

  asMock(createSelectedValuesFilter)
    .mockName('createSelectedValuesFilter')
    .mockReturnValue(mock.excludeSelectedValuesFilter);

  asMock(tableUtils.doesColumnValueExist).mockResolvedValue(false);

  asMock(useFilterConditionFactories)
    .mockName('useFilterConditionFactories')
    .mockReturnValue(mock.filter);

  mockUseViewportData(1);

  asMock(mock.viewportData.findItem)
    .mockName('findItem')
    .mockReturnValue(mock.keyedItem);
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('should initially filter viewport by empty search text and exclude nothing', async () => {
  const { result } = await renderOnceAndWait();

  expect(result.current.searchText).toEqual('');
  expect(result.current.selectedKey).toBeNull();

  expect(createSearchTextFilter).toHaveBeenCalledWith(
    tableUtils,
    mock.columnName,
    ''
  );

  expect(createSelectedValuesFilter).toHaveBeenCalledWith(
    tableUtils,
    mock.columnName,
    new Set(),
    false,
    true
  );

  expect(useFilterConditionFactories).toHaveBeenCalledWith(
    mockTable.list,
    mock.searchTextFilter,
    mock.excludeSelectedValuesFilter
  );

  expect(useViewportFilter).toHaveBeenCalledWith(
    asMock(useViewportData).mock.results[0].value,
    mock.filter
  );
});

it('should memoize results', async () => {
  const { rerender, result } = await renderOnceAndWait();

  const prevResult = result.current;

  rerender();

  expect(result.current).toBe(prevResult);
});

it('should filter viewport by search text after debounce', async () => {
  const { result, waitForNextUpdate } = await renderOnceAndWait();

  jest.clearAllMocks();

  act(() => {
    result.current.onSearchTextChange(mock.searchText);
  });

  // search text updated, but debounce not expired
  expect(result.current.searchText).toEqual(mock.searchText);
  expect(createSearchTextFilter).not.toHaveBeenCalled();

  act(() => {
    jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
  });

  // debouncedSearchText change will trigger another doesColumnValueExist
  // call which will update state once resolved
  await waitForNextUpdate();

  expect(createSearchTextFilter).toHaveBeenCalledWith(
    tableUtils,
    mock.columnName,
    mock.searchText
  );

  expect(createSelectedValuesFilter).not.toHaveBeenCalled();

  expect(useFilterConditionFactories).toHaveBeenCalledWith(
    mockTable.list,
    mock.searchTextFilter,
    mock.excludeSelectedValuesFilter
  );

  expect(useViewportFilter).toHaveBeenCalledWith(
    asMock(useViewportData).mock.results[0].value,
    mock.filter
  );
});

it.each([
  [null, null],
  [null, mock.keyedItem],
  [mock.keyedItem.key, null],
  [mock.keyedItem.key, mock.keyedItem],
])(
  'should remove selection and search text from viewport, and add to value map if item found: %s',
  async (maybeKey, maybeItem) => {
    // Setup test with search text already set
    asMock(mock.viewportData.findItem).mockReturnValue(maybeItem);

    const { result, waitForNextUpdate } = await renderOnceAndWait();

    act(() => {
      result.current.onSearchTextChange(mock.searchText);
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    // debouncedSearchText change will trigger another doesColumnValueExist
    // call which will update state once resolved
    await waitForNextUpdate();

    expect(result.current.searchText).toEqual(mock.searchText);

    jest.clearAllMocks();
    // End setup

    act(() => {
      result.current.onSelectKey(maybeKey);
    });

    expect(result.current.searchText).toEqual('');
    expect(result.current.selectedKey).toEqual(maybeKey);

    const expectedValueMap =
      maybeKey == null || maybeItem == null
        ? new Map()
        : new Map([[mock.value, { value: mock.value }]]);

    if (maybeKey == null || maybeItem == null) {
      expect(mock.mapItemToValue).not.toHaveBeenCalled();
      expect(createSelectedValuesFilter).not.toHaveBeenCalled();
    } else {
      expect(mock.mapItemToValue).toHaveBeenCalledWith(maybeItem);
      expect(createSelectedValuesFilter).toHaveBeenCalledWith(
        tableUtils,
        mock.columnName,
        new Set(expectedValueMap.keys()),
        false,
        true
      );
    }

    expect(useFilterConditionFactories).toHaveBeenCalledWith(
      mockTable.list,
      mock.searchTextFilter,
      mock.excludeSelectedValuesFilter
    );

    expect(useViewportFilter).toHaveBeenCalledWith(
      asMock(useViewportData).mock.results[0].value,
      mock.filter
    );

    expect(result.current.selectedValueMap).toEqual(expectedValueMap);

    act(() => {
      jest.advanceTimersByTime(0);
    });

    // debouncedSearchText change will trigger another doesColumnValueExist
    // call which will update state once resolved
    await waitForNextUpdate();

    expect(result.current.selectedKey).toBeNull();
    expect(result.current.selectedValueMap).toEqual(expectedValueMap);
  }
);

describe('Flags', () => {
  const search = {
    empty: '',
    inSelection: 'in.selection',
    notInSelection: 'not.in.selection',
  };

  beforeEach(() => {
    asMock(mock.mapItemToValue)
      .mockName('mockItemToValue')
      .mockReturnValue(search.inSelection);
  });

  it.each([
    [search.empty, 0],
    [search.empty, 1],
    [search.inSelection, 0],
    [search.inSelection, 1],
    [search.notInSelection, 0],
    [search.notInSelection, 1],
  ])('should return search text flags: %s', async (searchText, listSize) => {
    mockUseViewportData(listSize);

    const { result, waitForNextUpdate } = await renderOnceAndWait();

    // Initial values
    expect(result.current).toMatchObject({
      hasSearchTextWithZeroResults: false,
      searchTextIsInSelectedValues: false,
    });

    act(() => {
      // We need to set something so that selectedValueMap will get populated
      // with result of mapItemToValue which returns `search.inSelection`
      result.current.onSelectKey('some.key');

      result.current.onSearchTextChange(searchText);
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    // debouncedSearchText change will trigger another doesColumnValueExist
    // call which will update state once resolved
    if (searchText !== '') {
      await waitForNextUpdate();
    }

    expect(result.current).toMatchObject({
      hasSearchTextWithZeroResults: searchText.length > 0 && listSize === 0,
      searchTextIsInSelectedValues: searchText === search.inSelection,
    });
  });
});

describe('onAddValues', () => {
  it('should do nothing if given empty values', async () => {
    const { result } = await renderOnceAndWait();

    const initialRenderCount = result.all.length;
    const prevResult = result.current;

    act(() => {
      result.current.onAddValues(new Set());
    });

    expect(result.all.length).toEqual(initialRenderCount + 1);
    expect(result.current.selectedValueMap).toBe(prevResult.selectedValueMap);
  });

  it('should update selected value map', async () => {
    const { result } = await renderOnceAndWait();

    const setValues = ['a', 'b', 'c', 'd', 'e'];

    act(() => {
      result.current.onAddValues(new Set(setValues));
    });

    expect(result.current.selectedValueMap).toEqual(
      new Map(setValues.map(value => [value, { value }]))
    );
  });
});

describe('onRemoveValues', () => {
  const initialSetValues = 'abcde';

  it.each([
    ['all', ''],
    [new Set('abc'), new Set('de')],
    [new Set('abcde'), new Set('')],
    [new Set('xyz'), new Set('abcde')],
  ] as const)(
    'should clear expected values: %s, %s',
    async (given, expectedSetValues) => {
      const { result } = await renderOnceAndWait();

      act(() => {
        result.current.onAddValues(new Set(initialSetValues));
      });

      expect(result.current.selectedValueMap.size).toEqual(5);

      act(() => {
        result.current.onRemoveValues(given);
      });

      expect(result.current.selectedValueMap).toEqual(
        new Map([...expectedSetValues].map(value => [value, { value }]))
      );
    }
  );
});

describe('searchTextExists', () => {
  // eslint-disable-next-line no-promise-executor-return
  const unresolvedPromise = new Promise<boolean>(() => undefined);

  it.each([
    // isLoading, isDebouncing, exists
    [true, true, true],
    [true, true, false],
    [true, false, true],
    [true, false, false],
    [false, true, true],
    [false, true, false],
  ])(
    'should be null if check is in progress: isLoading:%s, isDebouncing:%s, exists:%s',
    async (isLoading, isDebouncing, exists) => {
      asMock(tableUtils.doesColumnValueExist).mockReturnValue(
        isLoading ? unresolvedPromise : Promise.resolve(exists)
      );

      const { result } = await renderOnceAndWait();

      if (isDebouncing) {
        act(() => {
          // cause a mismatch of searchText with debouncedSearchText
          result.current.onSearchTextChange('mismatch');
        });
      }

      expect(result.current.searchTextExists).toBeNull();
    }
  );

  it.each([true, false])(
    'should be doesColumnValueExist return value if check is complete',
    async exists => {
      asMock(tableUtils.doesColumnValueExist).mockResolvedValue(exists);

      const { result } = await renderOnceAndWait();
      expect(result.current.searchTextExists).toEqual(exists);
    }
  );
});
