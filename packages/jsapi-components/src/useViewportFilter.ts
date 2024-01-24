import { useEffect } from 'react';
import type { dh.FilterCondition, dh.Table } from '@deephaven/jsapi-types';
import { UseViewportDataResult } from './useViewportData';

/**
 * Applies a filter to a viewport.
 * @param viewportData Viewport to filter
 * @param filter Filter to apply
 */
export function useViewportFilter<TItem>(
  viewportData: UseViewportDataResult<TItem, dh.Table>,
  filter: dh.FilterCondition[]
): void {
  const { applyFiltersAndRefresh } = viewportData;

  useEffect(() => {
    applyFiltersAndRefresh(filter);
  }, [applyFiltersAndRefresh, filter]);
}

export default useViewportFilter;
