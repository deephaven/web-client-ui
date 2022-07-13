import { SET_DASHBOARD_DATA } from './actionTypes';
import { getDashboardData } from './selectors';

/**
 * Action to replace the dashboard data for a dashboard
 * @param {string} id The ID of the dashboard to set the data on
 * @param {Record<string, unknown>} data Data for the dashboard
 * @returns The action to get dispatched
 */
export const setDashboardData = (
  id: string,
  data: Record<string, unknown>
): {
  type: 'SET_DASHBOARD_DATA';
  id: string;
  payload: Record<string, unknown>;
} => ({
  type: SET_DASHBOARD_DATA,
  id,
  payload: data,
});

/**
 * Action to update the dashboard data. Will combine the update with any existing dashboard data.
 * @param id The id of the dashboard to update the data on
 * @para updateData The data to combine with the existing dashboard data
 * @returns
 */
export const updateDashboardData = (
  id: string,
  data: Record<string, unknown>
) => (dispatch, getState) =>
  dispatch(
    setDashboardData(id, {
      ...getDashboardData(getState(), id),
      ...data,
    })
  );
