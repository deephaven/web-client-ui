import { DefaultRootState } from 'react-redux';
import { ClosedPanels } from '../PanelManager';

const EMPTY_MAP = new Map();

const EMPTY_OBJECT = Object.freeze({});

const EMPTY_ARRAY = Object.freeze([]);

/**
 * Retrieve the data for all dashboards
 * @param store The redux store
 * @returns Property mapping dashboard ID to data for that dashboard
 */
export const getAllDashboardsData = <T>(store: { dashboardData: T }): T =>
  store.dashboardData;

/**
 * @param {Store} store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @returns The data object for the dashboard with the specified ID
 */
export const getDashboardData = <T>(
  store: { dashboard: T },
  dashboardId: string
): Record<string, unknown> =>
  getAllDashboardsData(store)[dashboardId] ?? EMPTY_OBJECT;

/**
 * @param {Store} store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @returns The ClosedPanel array of panels that were previously closed/dehydrated
 */
export const getClosedPanelsForDashboard = (
  store,
  dashboardId: string
): ClosedPanels => getDashboardData(store, dashboardId).closed ?? EMPTY_ARRAY;

/**
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get data for
 * @returns {OpenedPanelMap} The map of panel IDs to components of all currently open components
 */
export const getOpenedPanelMapForDashboard = (store, dashboardId: string) =>
  getDashboardData(store, dashboardId).openedMap ?? EMPTY_MAP;
