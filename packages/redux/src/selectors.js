const EMPTY_MAP = new Map();

const EMPTY_ARRAY = Object.freeze([]);

// User
export const getUser = store => store.user;

export const getUserName = store => getUser(store).name;

export const getUserGroups = store => getUserGroups(store).groups;

export const getIsLoggedIn = store => store.isLoggedIn;

// Storage
export const getStorage = store => store.storage;

export const getCommandHistoryStorage = store =>
  getStorage(store).commandHistoryStorage;

export const getFileStorage = store => getStorage(store).fileStorage;

export const getWorkspaceStorage = store => getStorage(store).workspaceStorage;

// Workspace
export const getWorkspace = store => store.workspace;

// Settings
export const getSettings = store => getWorkspace(store).data.settings;

export const getDefaultDateTimeFormat = store =>
  getSettings(store).defaultDateTimeFormat;

export const getFormatter = store => getSettings(store).formatter;

export const getTimeZone = store => getSettings(store).timeZone;

export const getShowTimeZone = store => getSettings(store).showTimeZone;

export const getShowTSeparator = store => getSettings(store).showTSeparator;

export const getDisableMoveConfirmation = store =>
  getSettings(store).disableMoveConfirmation || false;

export const getShowSystemBadge = store => getSettings(store).showSystemBadge;

export const getDashboardColumns = store => store.dashboardColumns;

export const getDashboardInputFilters = store => store.dashboardInputFilters;

export const getDashboardIsolatedLinkerPanelIds = store =>
  store.dashboardIsolatedLinkerPanelIds;

export const getDashboardLinks = store => store.dashboardLinks;

export const getDashboardSessions = store => store.dashboardSessions;

export const getColumnsForDashboard = (store, dashboardId) =>
  getDashboardColumns(store)[dashboardId] || EMPTY_ARRAY;

export const getInputFiltersForDashboard = (store, dashboardId) =>
  getDashboardInputFilters(store)[dashboardId] || EMPTY_ARRAY;

export const getIsolatedLinkerPanelIdForDashboard = (store, dashboardId) =>
  getDashboardIsolatedLinkerPanelIds(store)[dashboardId] || null;

export const getLinksForDashboard = (store, dashboardId) =>
  getDashboardLinks(store)[dashboardId] || EMPTY_ARRAY;

export const getSessionForDashboard = (store, dashboardId) =>
  getDashboardSessions(store)[dashboardId] || EMPTY_ARRAY;

export const getDashboardClosedPanels = store => store.dashboardClosedPanels;

export const getDashboardOpenedPanelMaps = store =>
  store.dashboardOpenedPanelMaps;

export const getDashboardPanelTableMaps = store =>
  store.dashboardPanelTableMaps;

export const getClosedPanelsForDashboard = (store, dashboardId) =>
  getDashboardClosedPanels(store)[dashboardId] || EMPTY_ARRAY;

export const getOpenedPanelMapForDashboard = (store, dashboardId) =>
  getDashboardOpenedPanelMaps(store)[dashboardId] || EMPTY_MAP;

export const getTableMapForDashboard = (store, dashboardId) =>
  getDashboardPanelTableMaps(store)[dashboardId] || EMPTY_MAP;

export const getDashboardColumnSelectionValidators = store =>
  store.dashboardColumnSelectionValidators;

export const getDashboardConsoleCreatorSettings = store =>
  store.dashboardConsoleCreatorSettings;

export const getColumnSelectionValidatorForDashboard = (store, dashboardId) =>
  getDashboardColumnSelectionValidators(store)[dashboardId];

export const getConsoleCreatorSettingsForDashboard = (store, dashboardId) =>
  getDashboardConsoleCreatorSettings(store)[dashboardId];

export const getActiveTool = store => store.activeTool;

export const getControllerConfiguration = store =>
  store.controllerConfiguration;

export const getDraftManager = store => store.draftManager;

export const getServerConfigValues = store => store.serverConfigValues;
