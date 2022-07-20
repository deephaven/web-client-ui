import { DashboardData, RootState } from '@deephaven/redux';
import { ClosedPanels, OpenedPanelMap } from '../PanelManager';

const EMPTY_MAP = new Map();

const EMPTY_OBJECT = Object.freeze({});

const EMPTY_ARRAY = Object.freeze([]);

type Selector<R> = (state: RootState) => R;

/**
 * Retrieve the data for all dashboards
 * @param store The redux store
 * @returns Property mapping dashboard ID to data for that dashboard
 */
export const getAllDashboardsData: Selector<
  Record<string, DashboardData>
> = store => store.dashboardData;

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @returns The data object for the dashboard with the specified ID
 */
export const getDashboardData = (
  store: RootState,
  dashboardId: string
): DashboardData => getAllDashboardsData(store)[dashboardId] ?? EMPTY_OBJECT;

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @returns The ClosedPanel array of panels that were previously closed/dehydrated
 */
export const getClosedPanelsForDashboard = (
  store: RootState,
  dashboardId: string
): ClosedPanels =>
  (getDashboardData(store, dashboardId).closed ?? EMPTY_ARRAY) as ClosedPanels;

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @returns The map of panel IDs to components of all currently open components
 */
export const getOpenedPanelMapForDashboard = (
  store: RootState,
  dashboardId: string
): OpenedPanelMap =>
  (getDashboardData(store, dashboardId).openedMap ??
    EMPTY_MAP) as OpenedPanelMap;
