import { useMemo, useState } from 'react';
import { TABLE_ROW_HEIGHT } from '@deephaven/components';
import type { dh } from '@deephaven/jsapi-types';
import {
  createSearchTextFilter,
  FilterConditionFactory,
} from '@deephaven/jsapi-utils';
import {
  SEARCH_DEBOUNCE_MS,
  VIEWPORT_PADDING,
  VIEWPORT_SIZE,
} from '@deephaven/utils';
import { useDebouncedCallback } from '@deephaven/react-hooks';
import { useTableUtils } from './useTableUtils';
import useViewportData, {
  UseViewportDataProps,
  UseViewportDataResult,
} from './useViewportData';
import useFilterConditionFactories from './useFilterConditionFactories';
import useViewportFilter from './useViewportFilter';

export interface UseSearchableViewportDataProps<TData>
  extends UseViewportDataProps<TData, dh.Table> {
  additionalFilterConditionFactories?: FilterConditionFactory[];
  searchColumnNames: string | string[];
  timeZone: string;
}

export interface SearchableViewportData<TData>
  extends UseViewportDataResult<TData, dh.Table> {
  onSearchTextChange: (searchText: string) => void;
}

/**
 * Use a viewport data list with a search text filter. Supports additional filters.
 * @param table The table to use
 * @param itemHeight The height of each item
 * @param scrollDebounce The debounce time for scroll events
 * @param viewportSize The size of the viewport
 * @param viewportPadding The padding around the viewport
 * @param deserializeRow The row deserializer
 * @param searchColumnNames The column names to search
 * @param timeZone Timezone to use for date parsing
 * @param additionalFilterConditionFactories Additional filter condition factories
 */
export function useSearchableViewportData<TData>({
  additionalFilterConditionFactories = [],
  searchColumnNames,
  timeZone,
  ...props
}: UseSearchableViewportDataProps<TData>): SearchableViewportData<TData> {
  const tableUtils = useTableUtils();

  const [searchText, setSearchText] = useState<string>('');

  const searchTextFilter = useMemo(
    () =>
      createSearchTextFilter(
        tableUtils,
        searchColumnNames,
        searchText,
        timeZone
      ),
    [searchColumnNames, searchText, tableUtils, timeZone]
  );

  const onSearchTextChange = useDebouncedCallback(
    setSearchText,
    SEARCH_DEBOUNCE_MS
  );

  const list = useViewportData<TData, dh.Table>({
    itemHeight: TABLE_ROW_HEIGHT,
    viewportSize: VIEWPORT_SIZE,
    viewportPadding: VIEWPORT_PADDING,
    ...props,
  });

  const filter = useFilterConditionFactories(
    list.table,
    searchTextFilter,
    ...additionalFilterConditionFactories
  );

  useViewportFilter(list, filter);

  return {
    ...list,
    onSearchTextChange,
  };
}

export default useSearchableViewportData;
