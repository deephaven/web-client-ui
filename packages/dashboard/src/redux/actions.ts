import { DashboardData, PluginData, RootState } from '@deephaven/redux';
import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { SET_DASHBOARD_DATA } from './actionTypes';
import { getDashboardData, getPluginDataMapForDashboard } from './selectors';

/**
 * Action to replace the dashboard data for a dashboard
 * @param id The ID of the dashboard to set the data on
 * @param data Data for the dashboard
 * @returns The action to get dispatched
 */
export const setDashboardData = (
  id: string,
  data: DashboardData
): {
  type: string;
  id: string;
  payload: DashboardData;
} => ({
  type: SET_DASHBOARD_DATA,
  id,
  payload: data,
});

/**
 * Action to update the dashboard data. Will combine the update with any existing dashboard data.
 * @param id The id of the dashboard to update the data on
 * @param updateData The data to combine with the existing dashboard data
 * @returns
 */
export const updateDashboardData =
  (
    id: string,
    data: DashboardData
  ): ThunkAction<unknown, RootState, undefined, Action<unknown>> =>
  (dispatch, getState) =>
    dispatch(
      setDashboardData(id, {
        ...getDashboardData(getState(), id),
        ...data,
      })
    );

/**
 * Action to set the dashboard plugin data.
 * Will replace any existing plugin data for the plugin in the dashboard with the data provided.
 * @param id The id of the dashboard to set the data on
 * @param pluginId The id of the plugin to set the data on
 * @param data The data to replace the existing plugin data with
 * @returns Thunk action to dispatch
 */
export const setDashboardPluginData =
  (
    id: string,
    pluginId: string,
    data: PluginData
  ): ThunkAction<unknown, RootState, undefined, Action<unknown>> =>
  (dispatch, getState) =>
    dispatch(
      setDashboardData(id, {
        ...getDashboardData(getState(), id),
        pluginDataMap: {
          ...getPluginDataMapForDashboard(getState(), id),
          [pluginId]: data,
        },
      })
    );
