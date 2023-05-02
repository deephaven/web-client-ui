import debounce from 'lodash.debounce';
import type { Table, TreeTable } from '@deephaven/jsapi-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import { useMemo } from 'react';
import { UseViewportDataResult } from './useViewportData';

/**
 * React hook that returns a debounced search callback for filtering a table
 * viewport.
 * @param viewportData Table viewport to filter
 * @param columnName Column name to filter by
 * @param debounceMs Millisecond value to debounce
 */
export default function useDebouncedViewportSearch<
  I,
  T extends Table | TreeTable
>(
  viewportData: UseViewportDataResult<I, T>,
  columnName: string,
  debounceMs = 200
): (searchText: string) => void {
  return useMemo(
    () =>
      debounce((searchText: string) => {
        if (viewportData.table == null) {
          return;
        }

        const searchTextTrimmed = searchText.trim();

        if (searchTextTrimmed === '') {
          viewportData.applyFiltersAndRefresh([]);
          return;
        }

        const column = viewportData.table.findColumn(columnName);
        const value = TableUtils.makeFilterValue(
          column.type,
          searchTextTrimmed
        );
        const filter = [column.filter().contains(value)];

        viewportData.applyFiltersAndRefresh(filter);
      }, debounceMs),
    [columnName, debounceMs, viewportData]
  );
}
