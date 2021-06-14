import reducers from './reducers';
import reducerRegistry from './reducerRegistry';

// TODO #70: Separate all reducers into their respective modules, register from there
Object.entries(reducers).map(([name, reducer]) =>
  reducerRegistry.register(name, reducer)
);

export {
  getActiveTool,
  getClosedPanelsForDashboard,
  getColumnSelectionValidatorForDashboard,
  getColumnsForDashboard,
  getCommandHistoryStorage,
  getConsoleCreatorSettingsForDashboard,
  getControllerConfiguration,
  getDashboardClosedPanels,
  getDashboardColumnSelectionValidators,
  getDashboardColumns,
  getDashboardConsoleCreatorSettings,
  getDashboardInputFilters,
  getDashboardIsolatedLinkerPanelIds,
  getDashboardLinks,
  getDashboardOpenedPanelMaps,
  getDashboardPanelTableMaps,
  getDefaultDateTimeFormat,
  getDisableMoveConfirmation,
  getDraftManager,
  getFormatter,
  getInputFiltersForDashboard,
  getIsLoggedIn,
  getIsolatedLinkerPanelIdForDashboard,
  getLinksForDashboard,
  getOpenedPanelMapForDashboard,
  getServerConfigValues,
  getSettings,
  getShowSystemBadge,
  getShowTSeparator,
  getShowTimeZone,
  getStorage,
  getTableMapForDashboard,
  getTimeZone,
  getUser,
  getUserGroups,
  getUserName,
  getWorkspace,
  getWorkspaceStorage,
} from './selectors';
export {
  addDashboardLinks,
  deleteDashboardLinks,
  saveSettings,
  saveWorkspace,
  setActiveTool,
  setCommandHistoryStorage,
  setControllerConfiguration,
  setDashboardClosedPanels,
  setDashboardColumnSelectionValidator,
  setDashboardColumns,
  setDashboardConsoleCreatorSettings,
  setDashboardInputFilters,
  setDashboardIsolatedLinkerPanelId,
  setDashboardLinks,
  setDashboardOpenedPanelMap,
  setDashboardPanelTableMap,
  setDraftManager,
  setIsLoggedIn,
  setServerConfigValues,
  setUser,
  setWorkspace,
  setWorkspaceStorage,
  updateWorkspaceData,
} from './actions';
export { default as reducers } from './reducers';
export { default as reducerRegistry } from './reducerRegistry';
export { default as store } from './store';
