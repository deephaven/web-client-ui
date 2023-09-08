import { Key, useCallback, useMemo, useState } from 'react';
import type { Table } from '@deephaven/jsapi-types';
import {
  createSearchTextFilter,
  createSelectedValuesFilter,
  FilterConditionFactory,
} from '@deephaven/jsapi-utils';
import {
  SelectionT,
  useDebouncedCallback,
  usePromiseFactory,
} from '@deephaven/react-hooks';
import {
  COMBO_BOX_ITEM_HEIGHT,
  KeyedItem,
  SEARCH_DEBOUNCE_MS,
  VIEWPORT_PADDING,
  VIEWPORT_SIZE,
} from '@deephaven/utils';
import useFilterConditionFactories from './useFilterConditionFactories';
import useViewportData, { UseViewportDataResult } from './useViewportData';
import useViewportFilter from './useViewportFilter';
import useTableUtils from './useTableUtils';
import useTableClose from './useTableClose';

export interface UsePickerWithSelectedValuesResult<TItem, TValue> {
  list: UseViewportDataResult<TItem, Table>;
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
 * @param maybeTable
 * @param columnName
 * @param mapItemToValue
 * @param filterConditionFactories
 */
export function usePickerWithSelectedValues<TItem, TValue>(
  maybeTable: Table | null,
  columnName: string,
  mapItemToValue: (item: KeyedItem<TItem>) => TValue,
  ...filterConditionFactories: FilterConditionFactory[]
): UsePickerWithSelectedValuesResult<TItem, TValue> {
  const tableUtils = useTableUtils();

  // `searchText` should always be up to date for controlled search input.
  // `debouncedSearchText` will get updated after a delay to avoid updating
  // filters on every key stroke.
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');

  const [selectedKey, setSelectedKey] = useState<Key | null>(null);
  const [selectedValueMap, setSelectedValueMap] = useState<
    Map<TValue, { value: TValue }>
  >(() => new Map());

  const { data: valueExists, isLoading: valueExistsIsLoading } =
    usePromiseFactory(tableUtils.doesColumnValueExist, [
      maybeTable,
      columnName,
      debouncedSearchText,
      false /* isCaseSensitive */,
    ]);

  // If value exists check is still loading or if debounce hasn't completed, set
  // `searchTextExists` to null since it is indeterminate.
  const searchTextExists =
    valueExistsIsLoading || debouncedSearchText !== searchText
      ? null
      : valueExists;

  const searchTextFilter = useMemo(
    () => createSearchTextFilter(tableUtils, columnName, debouncedSearchText),
    [columnName, debouncedSearchText, tableUtils]
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

  const list = useViewportData<TItem, Table>({
    table: listTable,
    itemHeight: COMBO_BOX_ITEM_HEIGHT,
    viewportSize: VIEWPORT_SIZE,
    viewportPadding: VIEWPORT_PADDING,
  });

  const hasSearchTextWithZeroResults = searchText.length > 0 && list.size === 0;
  const searchTextIsInSelectedValues = selectedValueMap.has(
    searchText as TValue
  );

  const onDebouncedSearchTextChange = useDebouncedCallback(
    setDebouncedSearchText,
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
      setDebouncedSearchText('');

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
    [setSelectedKeyOnNextFrame, list.viewportData, mapItemToValue]
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
