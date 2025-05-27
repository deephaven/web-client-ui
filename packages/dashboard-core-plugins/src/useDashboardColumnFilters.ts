import { useCallback, useEffect, useMemo } from 'react';
import type { dh } from '@deephaven/jsapi-types';
import { IrisGridUtils, type InputFilter } from '@deephaven/iris-grid';
import {
  useLayoutManager,
  useDashboardId,
  useAppSelector,
  useDhId,
} from '@deephaven/dashboard';
import { type RootState } from '@deephaven/redux';
import { getInputFiltersForDashboard } from './redux';
import {
  type FilterColumnSourceId,
  emitFilterColumnsChanged,
  emitFilterTableChanged,
} from './FilterEvents';

/**
 * Subscribes to the dashboard column filters (a.k.a. InputFilter) for the current panel or widget, and
 * adds the columns provided to the filter options in the dashboard.
 * @param columns The columns this source has available for filtering.
 *                These are used to populate filter options in the UI (InputFilter, DropdownFilter)
 * @param table The table for this source if applicable.
 *              This is used to enable ChartBuilder from IrisGrid.
 * @returns The dashboard column filters (InputFilter[]) that apply to the columns provided.
 */
export function useDashboardColumnFilters(
  columns: readonly { name: string; type: string }[],
  table?: dh.Table
): InputFilter[] {
  const { eventHub } = useLayoutManager();
  const dashboardId = useDashboardId();
  const panelId = useDhId() as FilterColumnSourceId | null;

  useEffect(
    function columnsChanged() {
      if (panelId == null) {
        return;
      }
      emitFilterColumnsChanged(eventHub, panelId, columns);

      return () => emitFilterColumnsChanged(eventHub, panelId, null);
    },
    [eventHub, panelId, columns]
  );

  useEffect(function tableChanged() {
    if (table == null || panelId == null) {
      return;
    }
    emitFilterTableChanged(eventHub, panelId, table);

    return () => emitFilterTableChanged(eventHub, panelId, null);
  });

  const getInputFilters = useCallback(
    (s: RootState) => getInputFiltersForDashboard(s, dashboardId),
    [dashboardId]
  );

  const reduxInputFilters = useAppSelector(getInputFilters);

  const inputFilters = useMemo(
    () =>
      IrisGridUtils.getInputFiltersForColumns(
        columns,
        // They may have picked a column, but not actually entered a value yet. In that case, don't need to update.
        reduxInputFilters.filter(
          ({ value, excludePanelIds }) =>
            value != null &&
            (excludePanelIds == null ||
              (panelId != null && !excludePanelIds.includes(panelId)))
        )
      ),
    [columns, panelId, reduxInputFilters]
  );

  return inputFilters;
}

export default useDashboardColumnFilters;
