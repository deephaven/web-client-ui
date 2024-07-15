import { act, renderHook } from '@testing-library/react-hooks';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { usePickerItemScale } from '@deephaven/components';
import {
  createSearchTextFilter,
  createSelectedValuesFilter,
  FilterConditionFactory,
  TableUtils,
} from '@deephaven/jsapi-utils';
import {
  useDebouncedValue,
  type WindowedListData,
} from '@deephaven/react-hooks';
import { KeyedItem, TestUtils } from '@deephaven/utils';
import usePickerWithSelectedValues from './usePickerWithSelectedValues';
import useViewportData, { UseViewportDataResult } from './useViewportData';
import useViewportFilter from './useViewportFilter';
import useFilterConditionFactories from './useFilterConditionFactories';
import useTableUtils from './useTableUtils';
import { SEARCH_DEBOUNCE_MS } from './Constants';

jest.mock('./useFilterConditionFactories');
jest.mock('./useTableUtils');
jest.mock('./useViewportData');
jest.mock('./useViewportFilter');
jest.mock('@deephaven/components', () => ({
  ...jest.requireActual('@deephaven/components'),
  usePickerItemScale: jest.fn(),
}));
jest.mock('@deephaven/jsapi-utils', () => ({
  ...jest.requireActual('@deephaven/jsapi-utils'),
  createSearchTextFilter: jest.fn(),
  createSelectedValuesFilter: jest.fn(),
}));
jest.mock('@deephaven/react-hooks', () => ({
  ...jest.requireActual('@deephaven/react-hooks'),
  useDebouncedValue: jest.fn(),
}));

const { asMock, createMockProxy } = TestUtils;

interface MockItem {
  type: 'mock.item';
}

const tableUtils = createMockProxy<TableUtils>();

const mock = {
  columnName: 'mock.columnName',
  isDebouncingFalse: { isDebouncing: false } as ReturnType<
    typeof useDebouncedValue
  >,
  isDebouncingTrue: { isDebouncing: true } as ReturnType<
    typeof useDebouncedValue
  >,
  filter: [
    createMockProxy<DhType.FilterCondition>(),
    createMockProxy<DhType.FilterCondition>(),
  ],
  filterConditionFactories: [jest.fn(), jest.fn()] as FilterConditionFactory[],
  keyedItem: createMockProxy<KeyedItem<MockItem>>({
    key: 'mock.key',
    item: { type: 'mock.item' },
  }),
  mapItemToValue: jest.fn<string, [item: KeyedItem<MockItem>]>(),
  searchText: '  mock searchText  ',
  searchTextTrimmed: 'mock searchText',
  searchTextFilter: jest.fn() as FilterConditionFactory,
  selectedKey: 'mock.selectedKey',
  excludeSelectedValuesFilter: jest.fn() as FilterConditionFactory,
  timeZone: 'mock.timeZone',
  value: 'mock.value',
  viewportData: createMockProxy<WindowedListData<KeyedItem<MockItem>>>(),
};

const mockTable = {
  usersAndGroups: createMockProxy<DhType.Table>(),
  list: createMockProxy<DhType.Table>(),
};

function mockUseViewportData(size: number) {
  const viewportData = createMockProxy<
    UseViewportDataResult<MockItem, DhType.Table>
  >({
    table: mockTable.list,
    viewportData: mock.viewportData,
    size,
  });

  asMock(useViewportData)
    .mockName('useViewportData')
    .mockReturnValue(
      viewportData as UseViewportDataResult<unknown, DhType.Table>
    );
}

async function renderOnceAndWait(
  overrides?: Partial<Parameters<typeof usePickerWithSelectedValues>[0]>
) {
  const hookResult = renderHook(() =>
    usePickerWithSelectedValues({
      maybeTable: mockTable.usersAndGroups,
      columnName: mock.columnName,
      mapItemToValue: mock.mapItemToValue,
      filterConditionFactories: mock.filterConditionFactories,
      timeZone: 'mock.timeZone',
      ...overrides,
    })
  );

  await hookResult.waitForNextUpdate();

  return hookResult;
}

beforeEach(() => {
  jest.clearAllMocks();

  asMock(usePickerItemScale).mockName('usePickerItemScale').mockReturnValue({
    itemHeight: 32,
  });
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

  asMock(useDebouncedValue)
    .mockName('useDebouncedValue')
    .mockReturnValue(mock.isDebouncingFalse);

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

it.each([undefined, false, true])(
  'should initially filter viewport by empty search text and exclude nothing: %s',
  async trimSearchText => {
    const { result } = await renderOnceAndWait({ trimSearchText });

    expect(result.current.searchText).toEqual('');
    expect(result.current.selectedKey).toBeNull();

    expect(createSearchTextFilter).toHaveBeenCalledWith(
      tableUtils,
      mock.columnName,
      '',
      mock.timeZone
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
  }
);

it.each([[undefined], [mock.filterConditionFactories]])(
  'should create distinct sorted column table applying filter condition factories: %s',
  async filterConditionFactories => {
    await renderOnceAndWait({ filterConditionFactories });

    expect(tableUtils.createDistinctSortedColumnTable).toHaveBeenCalledWith(
      mockTable.usersAndGroups,
      mock.columnName,
      'asc',
      ...(filterConditionFactories ?? [])
    );
  }
);

it('should memoize results', async () => {
  const { rerender, result } = await renderOnceAndWait();

  const prevResult = result.current;

  rerender();

  expect(result.current).toBe(prevResult);
});

it.each([undefined, false, true])(
  'should filter viewport by search text after debounce',
  async trimSearchText => {
    const { result, waitForNextUpdate } = await renderOnceAndWait({
      trimSearchText,
    });

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
      trimSearchText === true ? mock.searchTextTrimmed : mock.searchText,
      mock.timeZone
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
  }
);

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
    empty: '  ',
    inSelection: '  in.selection  ',
    notInSelection: '  not.in.selection  ',
  };

  beforeEach(() => {
    asMock(mock.mapItemToValue)
      .mockName('mockItemToValue')
      .mockReturnValue(search.inSelection.trim());
  });

  describe.each([undefined, false, true])(
    'trimSearchText: %s',
    trimSearchText => {
      it.each([
        [search.empty, 0],
        [search.empty, 1],
        [search.inSelection, 0],
        [search.inSelection, 1],
        [search.notInSelection, 0],
        [search.notInSelection, 1],
      ])(
        'should return search text flags: %s',
        async (searchText, listSize) => {
          mockUseViewportData(listSize);

          const { result, waitForNextUpdate } = await renderOnceAndWait({
            trimSearchText,
          });

          const searchTextMaybeTrimmed =
            trimSearchText === true ? searchText.trim() : searchText;

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
          if (searchTextMaybeTrimmed !== '') {
            await waitForNextUpdate();
          }

          expect(result.current).toMatchObject({
            hasSearchTextWithZeroResults:
              searchTextMaybeTrimmed.length > 0 && listSize === 0,
            searchTextIsInSelectedValues:
              searchTextMaybeTrimmed === search.inSelection.trim(),
          });
        }
      );
    }
  );
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

  it.each(TestUtils.generateBooleanCombinations(3))(
    'should be null if check is in progress: isLoading:%s, isDebouncing:%s, valueExists:%s',
    async (valueExistsIsLoading, isDebouncing, valueExists) => {
      asMock(tableUtils.doesColumnValueExist).mockReturnValue(
        valueExistsIsLoading ? unresolvedPromise : Promise.resolve(valueExists)
      );

      asMock(useDebouncedValue).mockReturnValue({
        isDebouncing,
      } as ReturnType<typeof useDebouncedValue>);

      const { result } = await renderOnceAndWait();

      expect(useDebouncedValue).toHaveBeenCalledWith('', SEARCH_DEBOUNCE_MS);

      if (valueExistsIsLoading || isDebouncing) {
        expect(result.current.searchTextExists).toBeNull();
      } else {
        expect(result.current.searchTextExists).toEqual(valueExists);
      }
    }
  );

  it.each([true, false])(
    'should equal the return value of `doesColumnValueExist` if check is complete',
    async exists => {
      asMock(tableUtils.doesColumnValueExist).mockResolvedValue(exists);

      const { result } = await renderOnceAndWait();
      expect(result.current.searchTextExists).toEqual(exists);
    }
  );
});
