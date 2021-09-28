const EMPTY_MAP = new Map();

const EMPTY_OBJECT = Object.freeze({});

const EMPTY_ARRAY = Object.freeze([]);

/**
 * Retrieve the data for all dashboards
 * @param {Store} store The redux store
 * @returns Property mapping dashboard ID to data for that dashboard
 */
export const getAllDashboardsData = store => store.dashboardData;

/**
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get data for
 * @returns The data object for the dashboard with the specified ID
 */
export const getDashboardData = (store, dashboardId) =>
  getAllDashboardsData(store)[dashboardId] ?? EMPTY_OBJECT;

export const getClosedPanelsForDashboard = (store, dashboardId) =>
  getDashboardData(store, dashboardId).closed ?? EMPTY_ARRAY;

export const getOpenedPanelMapForDashboard = (store, dashboardId) =>
  getDashboardData(store, dashboardId).openedMap ?? EMPTY_MAP;
