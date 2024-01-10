import { DashboardData, RootState } from '@deephaven/redux';
import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { SET_DASHBOARD_DATA } from './actionTypes';
import { getDashboardData } from './selectors';

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
 * Action to set the plugin data for a dashboard
 * @param dashboardId The ID of the dashboard to set the data on
 * @param pluginId The ID of the plugin to set the data on
 * @param data Data for the dashboard
 * @returns The thunk to get dispatched
 */
export const setDashboardPluginData =
  (
    dashboardId: string,
    pluginId: string,
    data: DashboardData
  ): ThunkAction<unknown, RootState, undefined, Action<unknown>> =>
  (dispatch, getState) => {
    const dashboardData = getDashboardData(getState(), dashboardId);
    dispatch(
      setDashboardData(dashboardId, {
        ...dashboardData,
        pluginData: {
          ...dashboardData.pluginData,
          [pluginId]: data,
        },
      })
    );
  };
