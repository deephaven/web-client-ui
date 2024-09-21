import {
  type AppStore,
  type DashboardData,
  type PluginData,
  type PluginDataMap,
  type RootDispatch,
  type RootState,
} from '@deephaven/redux';
import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
  useStore,
} from 'react-redux';
import { type ClosedPanels, type OpenedPanelMap } from '../PanelManager';

const EMPTY_MAP = new Map();

const EMPTY_OBJECT = Object.freeze({});

const EMPTY_ARRAY = Object.freeze([]);

type Selector<R> = (state: RootState) => R;

// https://react-redux.js.org/using-react-redux/usage-with-typescript#define-typed-hooks
// Defined in @deephaven/dashboard, as that's the most common package with React and @deephaven/redux as dependencies
// We could have another package specifically for this, but it's not really necessary.
export const useAppDispatch: () => RootDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore: () => AppStore = useStore;

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

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @returns The map of plugin IDs to data for all plugins on the dashboard
 */
export const getPluginDataMapForDashboard = <T = PluginData>(
  store: RootState,
  dashboardId: string
): PluginDataMap<T> =>
  getDashboardData(store, dashboardId).pluginDataMap ?? EMPTY_OBJECT;

/**
 * @param store The redux store
 * @param dashboardId The dashboard ID to get data for
 * @param pluginId The plugin ID to get data for
 * @returns The plugin data
 */
export const getPluginDataForDashboard = <T = PluginData>(
  store: RootState,
  dashboardId: string,
  pluginId: string
): T => getPluginDataMapForDashboard<T>(store, dashboardId)[pluginId];
