import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PluginData, RootState } from '@deephaven/redux';
import { getPluginDataForDashboard } from './selectors';
import { setDashboardPluginData } from './actions';

/**
 * Custom hook that provides access to plugin data for a specific dashboard and plugin.
 * @param dashboardId - The ID of the dashboard.
 * @param pluginId - The ID of the plugin.
 * @returns A tuple containing the plugin data and a function to update the plugin data.
 */
export function useDashboardPluginData<T = PluginData>(
  dashboardId: string,
  pluginId: string
): [T, (data: T) => void] {
  const dispatch = useDispatch();
  const data = useSelector((store: RootState) =>
    getPluginDataForDashboard(store, dashboardId, pluginId)
  );
  const setData = useCallback(
    newData => dispatch(setDashboardPluginData(dashboardId, pluginId, newData)),
    [dashboardId, pluginId, dispatch]
  );
  return [data, setData];
}

export default { useDashboardPluginData };
