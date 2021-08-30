import {
  SET_IS_LOGGED_IN,
  SET_USER,
  SET_WORKSPACE,
  SET_COMMAND_HISTORY_STORAGE,
  SET_WORKSPACE_STORAGE,
  SET_DASHBOARD_INPUT_FILTERS,
  SET_DASHBOARD_ISOLATED_LINKER_PANEL_ID,
  SET_DASHBOARD_CLOSED_PANELS,
  SET_DASHBOARD_OPENED_PANEL_MAP,
  SET_DASHBOARD_PANEL_TABLE_MAP,
  SET_DASHBOARD_COLUMNS,
  SET_DASHBOARD_LINKS,
  ADD_DASHBOARD_LINKS,
  DELETE_DASHBOARD_LINKS,
  SET_ACTIVE_TOOL,
  SET_DASHBOARD_COLUMN_SELECTION_VALIDATOR,
  SET_DASHBOARD_CONSOLE_CREATOR_SETTINGS,
  SET_CONTROLLER_CONFIGURATION,
  SET_DRAFT_MANAGER,
  SET_SERVER_CONFIG_VALUES,
  SET_FILE_STORAGE,
} from './actionTypes';

export const setIsLoggedIn = isLoggedIn => ({
  type: SET_IS_LOGGED_IN,
  payload: isLoggedIn,
});

export const setUser = user => ({
  type: SET_USER,
  payload: user,
});

export const setWorkspace = workspace => ({
  type: SET_WORKSPACE,
  payload: workspace,
});

export const setWorkspaceStorage = workspaceStorage => ({
  type: SET_WORKSPACE_STORAGE,
  payload: workspaceStorage,
});

export const setCommandHistoryStorage = commandHistoryStorage => ({
  type: SET_COMMAND_HISTORY_STORAGE,
  payload: commandHistoryStorage,
});

export const setFileStorage = fileStorage => ({
  type: SET_FILE_STORAGE,
  payload: fileStorage,
});

/**
 * Sets the specified workspace locally and saves it remotely
 * @param {Workspace} workspace The workspace to save
 */
export const saveWorkspace = workspace => (dispatch, getState) => {
  dispatch(setWorkspace(workspace));

  const { storage } = getState();
  const { workspaceStorage } = storage;
  return workspaceStorage.save(workspace);
};

/**
 * Update part of the workspace data and save it
 * @param {Object} workspaceData The property to update in workspace data
 */
export const updateWorkspaceData = workspaceData => (dispatch, getState) => {
  const { workspace } = getState();
  const { data } = workspace;
  const newWorkspace = {
    ...workspace,
    data: {
      ...data,
      ...workspaceData,
    },
  };
  return dispatch(saveWorkspace(newWorkspace));
};

/**
 * Sets the specified settings locally and saves them remotely
 * @param {Object} settings The settings to save
 */
export const saveSettings = settings => dispatch =>
  dispatch(updateWorkspaceData({ settings }));

export const setDashboardColumns = (id, columns) => ({
  type: SET_DASHBOARD_COLUMNS,
  payload: columns,
  id,
});

export const setDashboardInputFilters = (id, inputFilters) => ({
  type: SET_DASHBOARD_INPUT_FILTERS,
  payload: inputFilters,
  id,
});

export const setDashboardIsolatedLinkerPanelId = (id, panelId) => ({
  type: SET_DASHBOARD_ISOLATED_LINKER_PANEL_ID,
  payload: panelId,
  id,
});

export const setDashboardClosedPanels = (id, closedPanels) => ({
  type: SET_DASHBOARD_CLOSED_PANELS,
  payload: closedPanels,
  id,
});

export const setDashboardLinks = (id, links) => ({
  type: SET_DASHBOARD_LINKS,
  payload: links,
  id,
});

export const addDashboardLinks = (id, links) => ({
  type: ADD_DASHBOARD_LINKS,
  payload: links,
  id,
});

export const deleteDashboardLinks = (id, links) => ({
  type: DELETE_DASHBOARD_LINKS,
  payload: links,
  id,
});

export const setDashboardOpenedPanelMap = (id, openedPanelMap) => ({
  type: SET_DASHBOARD_OPENED_PANEL_MAP,
  payload: openedPanelMap,
  id,
});

export const setDashboardPanelTableMap = (id, panelTableMap) => ({
  type: SET_DASHBOARD_PANEL_TABLE_MAP,
  payload: panelTableMap,
  id,
});

export const setDashboardColumnSelectionValidator = (
  id,
  gridColumnSelectionValidator
) => ({
  type: SET_DASHBOARD_COLUMN_SELECTION_VALIDATOR,
  payload: gridColumnSelectionValidator,
  id,
});

export const setDashboardConsoleCreatorSettings = (
  id,
  consoleCreatorSettings
) => ({
  type: SET_DASHBOARD_CONSOLE_CREATOR_SETTINGS,
  payload: consoleCreatorSettings,
  id,
});

export const setActiveTool = payload => ({
  type: SET_ACTIVE_TOOL,
  payload,
});

export const setControllerConfiguration = controllerConfiguration => ({
  type: SET_CONTROLLER_CONFIGURATION,
  payload: controllerConfiguration,
});

export const setDraftManager = draftManager => ({
  type: SET_DRAFT_MANAGER,
  payload: draftManager,
});

export const setServerConfigValues = serverConfigValues => ({
  type: SET_SERVER_CONFIG_VALUES,
  payload: serverConfigValues,
});
