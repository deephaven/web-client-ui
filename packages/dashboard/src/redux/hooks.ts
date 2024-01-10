import { useDispatch, useSelector } from 'react-redux';
import { PluginData, RootState } from '@deephaven/redux';
import { getPluginDataForDashboard } from './selectors';
import { setDashboardPluginData } from './actions';

export function useDashboardPluginData(
  dashboardId: string,
  pluginId: string
): [PluginData, (data: PluginData) => void] {
  const dispatch = useDispatch();
  return [
    useSelector((store: RootState) =>
      getPluginDataForDashboard(store, dashboardId, pluginId)
    ),
    data => dispatch(setDashboardPluginData(dashboardId, pluginId, data)),
  ];
}

export default { useDashboardPluginData };
