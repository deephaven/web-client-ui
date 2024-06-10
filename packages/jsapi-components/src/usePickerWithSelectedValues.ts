import { Key, useCallback, useMemo, useState } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import {
  createSearchTextFilter,
  createSelectedValuesFilter,
  FilterConditionFactory,
} from '@deephaven/jsapi-utils';
import {
  useDebouncedCallback,
  useDebouncedValue,
  usePromiseFactory,
} from '@deephaven/react-hooks';
import { useComboBoxItemScale } from '@deephaven/components';
import {
  KeyedItem,
  SEARCH_DEBOUNCE_MS,
  SelectionT,
  VIEWPORT_PADDING,
  VIEWPORT_SIZE,
} from '@deephaven/utils';
import useFilterConditionFactories from './useFilterConditionFactories';
import useViewportData, { UseViewportDataResult } from './useViewportData';
import useViewportFilter from './useViewportFilter';
import useTableUtils from './useTableUtils';
import useTableClose from './useTableClose';

export interface UsePickerWithSelectedValuesResult<TItem, TValue> {
  list: UseViewportDataResult<TItem, dh.Table>;
  hasSearchTextWithZeroResults: boolean;
  searchText: string;
  searchTextExists: boolean | null;
  searchTextIsInSelectedValues: boolean;
  selectedKey: Key | null;
  selectedValueMap: ReadonlyMap<TValue, { value: TValue }>;
  onSearchTextChange: (searchText: string) => void;
  onSelectKey: (key: Key | null) => void;
  onAddValues: (values: ReadonlySet<TValue>) => void;
  onRemoveValues: (values: SelectionT<TValue>) => void;
}

/**
 * Manages a list of available items that can be searched and selected. Selected
 * items are removed from the list and managed in a selectedValueMap data
 * structure. Useful for components that contain a picker but show selected
 * values in a separate component.
 * @param maybeTable The table to get the list of items from
 * @param columnName The column name to get the list of items from
 * @param mapItemToValue A function to map an item to a value
 * @param filterConditionFactories Optional filter condition factories to apply to the list
 * @param trimSearchText Whether to trim the search text before filtering. Defaults to false
 */
export function usePickerWithSelectedValues<TItem, TValue>({
  maybeTable,
  columnName,
  mapItemToValue,
  filterConditionFactories = [],
  trimSearchText = false,
}: {
  maybeTable: dh.Table | null;
  columnName: string;
  mapItemToValue: (item: KeyedItem<TItem>) => TValue;
  filterConditionFactories?: FilterConditionFactory[];
  trimSearchText?: boolean;
}): UsePickerWithSelectedValuesResult<TItem, TValue> {
  const { itemHeight } = useComboBoxItemScale();

  const tableUtils = useTableUtils();

  // `searchText` should always be up to date for controlled search input.
  // `appliedSearchText` will get updated after a delay to avoid updating
  // filters on every key stroke. It will also be trimmed of leading / trailing
  // spaces if `trimSearchText` is true.
  const [searchText, setSearchText] = useState('');
  const [appliedSearchText, setAppliedSearchText] = useState('');

  const applySearchText = useCallback(
    (text: string) => {
      setAppliedSearchText(trimSearchText ? text.trim() : text);
    },
    [trimSearchText]
  );

  const searchTextMaybeTrimmed = useMemo(
    () => (trimSearchText ? searchText.trim() : searchText),
    [searchText, trimSearchText]
  );

  const [selectedKey, setSelectedKey] = useState<Key | null>(null);
  const [selectedValueMap, setSelectedValueMap] = useState<
    Map<TValue, { value: TValue }>
  >(() => new Map());

  const { data: valueExists, isLoading: valueExistsIsLoading } =
    usePromiseFactory(tableUtils.doesColumnValueExist, [
      maybeTable,
      columnName,
      appliedSearchText,
      false /* isCaseSensitive */,
    ]);

  // The `searchTextFilter` starts getting applied to the list whenever
  // `appliedSearchText` changes, after which there is a small delay before the
  // items are in sync. Use a debounce timer to allow a little extra time
  // before calculating `searchTextExists` below. Note that there are 2 debounce
  // timers at play here:
  // 1. `onDebouncedSearchTextChange` applies the search text after user stops typing
  // 2. `useDebouncedValue` debounces whenever the result of the first debounce
  //    changes, and `isApplyingFilter` will be true while this 2nd timer is active.
  const { isDebouncing: isApplyingFilter } = useDebouncedValue(
    appliedSearchText,
    SEARCH_DEBOUNCE_MS
  );

  // If value exists check is still loading or if debounce hasn't completed, set
  // `searchTextExists` to null since it is indeterminate.
  const searchTextExists =
    isApplyingFilter || valueExistsIsLoading ? null : valueExists;

  const searchTextFilter = useMemo(
    () => createSearchTextFilter(tableUtils, columnName, appliedSearchText),
    [appliedSearchText, columnName, tableUtils]
  );

  // Filter out selected values from the picker
  const excludeSelectedValuesFilter = useMemo(
    () =>
      createSelectedValuesFilter(
        tableUtils,
        columnName,
        new Set(selectedValueMap.keys()),
        false,
        true
      ),
    [columnName, selectedValueMap, tableUtils]
  );

  const { data: listTable } = usePromiseFactory(
    tableUtils.createDistinctSortedColumnTable,
    [maybeTable, columnName, 'asc', ...filterConditionFactories]
  );

  useTableClose(listTable);

  const list = useViewportData<TItem, dh.Table>({
    table: listTable,
    itemHeight,
    viewportSize: VIEWPORT_SIZE,
    viewportPadding: VIEWPORT_PADDING,
  });

  const hasSearchTextWithZeroResults =
    searchTextMaybeTrimmed.length > 0 && list.size === 0;
  const searchTextIsInSelectedValues = selectedValueMap.has(
    searchTextMaybeTrimmed as TValue
  );

  const onDebouncedSearchTextChange = useDebouncedCallback(
    applySearchText,
    SEARCH_DEBOUNCE_MS
  );

  const onSearchTextChange = useCallback(
    (text: string) => {
      setSearchText(text);
      onDebouncedSearchTextChange(text);
    },
    [onDebouncedSearchTextChange]
  );

  const setSelectedKeyOnNextFrame = useDebouncedCallback(setSelectedKey, 0);

  const onSelectKey = useCallback(
    (key: Key | null) => {
      setSearchText('');
      applySearchText('');

      // Set the selection temporarily to avoid the picker staying open
      setSelectedKey(key);

      // Clear the selection on next frame since selected items get removed from
      // the list and added to `selectedValues` Map
      setSelectedKeyOnNextFrame(null);

      // key will be null in scenarios where search text doesn't match an item
      // and user clicks outside of picker
      if (key == null) {
        return;
      }

      const item = list.viewportData.findItem(key);

      if (item == null) {
        return;
      }

      const value = mapItemToValue(item);

      setSelectedValueMap(prev => {
        const next = new Map(prev);
        next.set(value, { value });
        return next;
      });
    },
    [
      applySearchText,
      setSelectedKeyOnNextFrame,
      list.viewportData,
      mapItemToValue,
    ]
  );

  const onAddValues = useCallback((values: ReadonlySet<TValue>) => {
    setSelectedValueMap(prev => {
      if (values.size === 0) {
        return prev;
      }

      const next = new Map(prev);

      // eslint-disable-next-line no-restricted-syntax
      for (const value of values) {
        next.set(value, { value });
      }

      return next;
    });
  }, []);

  const onRemoveValues = useCallback((values: SelectionT<TValue>) => {
    setSelectedValueMap(prev => {
      if (values === 'all') {
        return new Map();
      }

      const next = new Map(prev);

      // eslint-disable-next-line no-restricted-syntax
      for (const value of values) {
        next.delete(value);
      }

      return next;
    });
  }, []);

  const filter = useFilterConditionFactories(
    list.table,
    searchTextFilter,
    excludeSelectedValuesFilter
  );

  useViewportFilter(list, filter);

  return useMemo(
    () => ({
      list,
      hasSearchTextWithZeroResults,
      searchText,
      searchTextExists,
      searchTextIsInSelectedValues,
      selectedKey,
      selectedValueMap,
      onSearchTextChange,
      onSelectKey,
      onAddValues,
      onRemoveValues,
    }),
    [
      hasSearchTextWithZeroResults,
      list,
      onAddValues,
      onRemoveValues,
      onSearchTextChange,
      onSelectKey,
      searchText,
      searchTextExists,
      searchTextIsInSelectedValues,
      selectedKey,
      selectedValueMap,
    ]
  );
}

export default usePickerWithSelectedValues;
