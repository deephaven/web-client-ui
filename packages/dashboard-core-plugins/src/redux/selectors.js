import { getDashboardData } from '@deephaven/dashboard';

const EMPTY_MAP = new Map();

const EMPTY_ARRAY = Object.freeze([]);

/**
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get data for
 * @returns {Column[]} All column objects found in all panels in this dashboard
 */
export const getColumnsForDashboard = (store, dashboardId) =>
  getDashboardData(store, dashboardId).columns ?? EMPTY_ARRAY;

/**
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get data for
 * @returns {FilterChangeEvent[]} The filters set on this dashboard
 */
export const getInputFiltersForDashboard = (store, dashboardId) =>
  getDashboardData(store, dashboardId).filters ?? EMPTY_ARRAY;

/**
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get data for
 * @returns {Map<string, Table>} Map from panel ID to the table used in that panel
 */
export const getTableMapForDashboard = (store, dashboardId) =>
  getDashboardData(store, dashboardId).tableMap ?? EMPTY_MAP;

/**
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get the data for
 * @returns {string|undefined} The panel ID that is isolated, undefined if none is isolated
 */
export const getIsolatedLinkerPanelIdForDashboard = (store, dashboardId) =>
  getDashboardData(store, dashboardId).isolatedLinkerPanelId;

/**
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get the data from
 * @returns {Link[]} The links for the dashboard
 */
export const getLinksForDashboard = (store, dashboardId) =>
  getDashboardData(store, dashboardId).links ?? EMPTY_ARRAY;

/**
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get the column selection validators for
 * @returns {ColumnSelectionValidator|undefined} Column selection validator active on a dashboard
 */
export const getColumnSelectionValidatorForDashboard = (store, dashboardId) =>
  getDashboardData(store, dashboardId).columnSelectionValidator;

/**
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get the console settings for
 * @returns {ConsoleSettings|undefined} Console settings for this dashboard
 */
export const getDashboardConsoleSettings = (store, dashboardId) =>
  getDashboardData(store, dashboardId).consoleSettings;

/**
 *
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get the SessionWrapper for
 * @returns {SessionWrapper|undefined} The session wrapper for the dashboard
 */
export const getDashboardSessionWrapper = (store, dashboardId) =>
  getDashboardData(store, dashboardId).sessionWrapper;
