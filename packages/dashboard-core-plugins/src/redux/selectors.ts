import { getDashboardData } from '@deephaven/dashboard';
import { Column, Table } from '@deephaven/jsapi-shim';
import { RootState } from '@deephaven/redux';
import { FilterChangeEvent } from '../FilterPlugin';
import { Link } from '../linker/LinkerUtils';
import { FilterSet } from '../panels';
import { ColumnSelectionValidator } from '../panels/ColumnSelectionValidator';
import { SessionWrapper } from './actions';

const EMPTY_MAP = new Map();

const EMPTY_ARRAY = Object.freeze([]);

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @returns All column objects found in all panels in this dashboard
 */
export const getColumnsForDashboard = (
  store: RootState,
  dashboardId: string
): Column[] =>
  (getDashboardData(store, dashboardId).columns ?? EMPTY_ARRAY) as Column[];

/**
 * Get the known filter sets for the dashboard.
 * @param store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @returns The filter sets set on this dashboard
 */
export const getFilterSetsForDashboard = (
  store: RootState,
  dashboardId: string
): FilterSet[] =>
  (getDashboardData(store, dashboardId).filterSets ??
    EMPTY_ARRAY) as FilterSet[];

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @returns The filters set on this dashboard
 */
export const getInputFiltersForDashboard = (
  store: RootState,
  dashboardId: string
): FilterChangeEvent[] =>
  (getDashboardData(store, dashboardId).filters ??
    EMPTY_ARRAY) as FilterChangeEvent[];

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @returns Map from panel ID to the table used in that panel
 */
export const getTableMapForDashboard = (
  store: RootState,
  dashboardId: string
): Map<string, Table> =>
  (getDashboardData(store, dashboardId).tableMap ?? EMPTY_MAP) as Map<
    string,
    Table
  >;

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get the data for
 * @return The panel ID that is isolated, undefined if none is isolated
 */
export const getIsolatedLinkerPanelIdForDashboard = (
  store: RootState,
  dashboardId: string
): string | undefined =>
  getDashboardData(store, dashboardId).isolatedLinkerPanelId as
    | string
    | undefined;

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get the data from
 * @returns The links for the dashboard
 */
export const getLinksForDashboard = (
  store: RootState,
  dashboardId: string
): Link[] =>
  (getDashboardData(store, dashboardId).links ?? EMPTY_ARRAY) as Link[];

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get the column selection validators for
 * @returns Column selection validator active on a dashboard
 */
export const getColumnSelectionValidatorForDashboard = (
  store: RootState,
  dashboardId: string
): ColumnSelectionValidator | undefined =>
  getDashboardData(store, dashboardId).columnSelectionValidator as
    | ColumnSelectionValidator
    | undefined;

/**
 * @param {Store} store The redux store
 * @param {string} dashboardId The dashboard ID to get the console settings for
 * @returns {ConsoleSettings|undefined} Console settings for this dashboard
 */
export const getDashboardConsoleSettings = (
  store: RootState,
  dashboardId: string
): Record<string, unknown> =>
  getDashboardData(store, dashboardId).consoleSettings as Record<
    string,
    unknown
  >;

/**
 *
 * @param store The redux store
 * @param dashboardId The dashboard ID to get the SessionWrapper for
 * @returns The session wrapper for the dashboard
 */
export const getDashboardSessionWrapper = (
  store: RootState,
  dashboardId: string
): SessionWrapper =>
  getDashboardData(store, dashboardId).sessionWrapper as SessionWrapper;
