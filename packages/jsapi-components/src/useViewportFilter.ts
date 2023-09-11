import { useEffect } from 'react';
import type { FilterCondition, Table } from '@deephaven/jsapi-types';
import { UseViewportDataResult } from './useViewportData';

/**
 * Applies a filter to a viewport.
 * @param viewportData Viewport to filter
 * @param filter Filter to apply
 */
export function useViewportFilter<TItem>(
  viewportData: UseViewportDataResult<TItem, Table>,
  filter: FilterCondition[]
): void {
  const { applyFiltersAndRefresh } = viewportData;

  useEffect(() => {
    applyFiltersAndRefresh(filter);
  }, [applyFiltersAndRefresh, filter]);
}

export default useViewportFilter;
