import { useMemo, useState } from 'react';
import type { Table } from '@deephaven/jsapi-types';
import {
  createSearchTextFilter,
  FilterConditionFactory,
} from '@deephaven/jsapi-utils';
import {
  SEARCH_DEBOUNCE_MS,
  TABLE_ROW_HEIGHT,
  VIEWPORT_PADDING,
  VIEWPORT_SIZE,
} from '@deephaven/utils';
import { useDebouncedCallback } from '@deephaven/react-hooks';
import { useTableUtils } from './useTableUtils';
import useViewportData, { UseViewportDataResult } from './useViewportData';
import useFilterConditionFactories from './useFilterConditionFactories';
import useViewportFilter from './useViewportFilter';

export interface SearchableViewportData<TData> {
  list: UseViewportDataResult<TData, Table>;
  onSearchTextChange: (searchText: string) => void;
}

/**
 * Use a viewport data list with a search text filter. Supports additional filters.
 * @param maybeTable The table to use
 * @param searchColumnNames The column names to search
 * @param additionalFilterConditionFactories Additional filter condition factories
 */
export function useSearchableViewportData<TData>(
  maybeTable: Table | null,
  searchColumnNames: string | string[],
  ...additionalFilterConditionFactories: FilterConditionFactory[]
): SearchableViewportData<TData> {
  const tableUtils = useTableUtils();

  const [searchText, setSearchText] = useState<string>('');

  const searchTextFilter = useMemo(
    () => createSearchTextFilter(tableUtils, searchColumnNames, searchText),
    [searchColumnNames, searchText, tableUtils]
  );

  const onSearchTextChange = useDebouncedCallback(
    setSearchText,
    SEARCH_DEBOUNCE_MS
  );

  const list = useViewportData<TData, Table>({
    table: maybeTable,
    itemHeight: TABLE_ROW_HEIGHT,
    viewportSize: VIEWPORT_SIZE,
    viewportPadding: VIEWPORT_PADDING,
  });

  const filter = useFilterConditionFactories(
    list.table,
    searchTextFilter,
    ...additionalFilterConditionFactories
  );

  useViewportFilter(list, filter);

  return {
    list,
    onSearchTextChange,
  };
}

export default useSearchableViewportData;
