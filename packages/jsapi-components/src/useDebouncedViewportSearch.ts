import debounce from 'lodash.debounce';
import type { Table, TreeTable } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import { useApi } from '@deephaven/jsapi-bootstrap';
import Log from '@deephaven/log';
import { useEffect, useMemo } from 'react';
import { UseViewportDataResult } from './useViewportData';

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
export default function useDebouncedViewportSearch<
  I,
  T extends Table | TreeTable,
>(
  viewportData: UseViewportDataResult<I, T>,
  columnName: string,
  debounceMs = DEBOUNCE_VIEWPORT_SEARCH_MS
): (searchText: string) => void {
  const dh = useApi();
  const tableUtils = useMemo(() => new TableUtils(dh), [dh]);
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
