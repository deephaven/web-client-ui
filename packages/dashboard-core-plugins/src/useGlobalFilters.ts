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
import { emitFilterColumnsChanged } from './FilterEvents';
import { type FilterColumnSourceId } from './FilterPlugin';

export function useGlobalFilters(columns: readonly dh.Column[]): InputFilter[] {
  const { eventHub } = useLayoutManager();
  const dashboardId = useDashboardId();
  const panelId = useDhId();
  useEffect(() => {
    emitFilterColumnsChanged(
      eventHub,
      panelId as FilterColumnSourceId,
      columns
    );
  }, [eventHub, panelId, columns]);

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
              (panelId != null && !excludePanelIds.includes(panelId as string)))
        )
      ),
    [columns, panelId, reduxInputFilters]
  );

  return inputFilters;
}

export default useGlobalFilters;
