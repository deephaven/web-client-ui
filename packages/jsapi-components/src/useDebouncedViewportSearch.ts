import debounce from 'lodash.debounce';
import type { Table, TreeTable } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { useEffect, useMemo } from 'react';
import { UseViewportDataResult } from './useViewportData';
import useTableUtils from './useTableUtils';

const log = Log.module('useDebouncedViewportSearch');

export const DEBOUNCE_VIEWPORT_SEARCH_MS = 200;

/**
 * React hook that returns a debounced search callback for filtering a table
 * viewport.
 * @param viewportData Table viewport to filter
 * @param columnName Column name to filter by
 * @param debounceMs Millisecond value to debounce
 * @returns A debounced search function
 */
export function useDebouncedViewportSearch<I, T extends Table | TreeTable>(
  viewportData: UseViewportDataResult<I, T>,
  columnName: string,
  debounceMs = DEBOUNCE_VIEWPORT_SEARCH_MS
): (searchText: string) => void {
  const tableUtils = useTableUtils();
  const { table, applyFiltersAndRefresh } = viewportData;

  const debouncedSearch = useMemo(
    () =>
      debounce((searchText: string) => {
        log.debug(`Applying debounced searchText '${searchText}'`);

        if (table == null) {
          return;
        }

        const searchTextTrimmed = searchText.trim();

        if (searchTextTrimmed === '') {
          applyFiltersAndRefresh([]);
          return;
        }

        const column = table.findColumn(columnName);
        const value = tableUtils.makeFilterValue(
          column.type,
          searchTextTrimmed
        );
        const filter = [column.filter().contains(value)];

        applyFiltersAndRefresh(filter);
      }, debounceMs),
    [applyFiltersAndRefresh, columnName, debounceMs, table, tableUtils]
  );

  useEffect(
    () => () => {
      log.debug('Cancelling debounced search function');
      debouncedSearch.cancel();
    },
    [debouncedSearch]
  );

  return debouncedSearch;
}

export default useDebouncedViewportSearch;
