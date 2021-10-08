import {
  SET_USER,
  SET_WORKSPACE,
  SET_COMMAND_HISTORY_STORAGE,
  SET_WORKSPACE_STORAGE,
  SET_ACTIVE_TOOL,
  SET_FILE_STORAGE,
} from './actionTypes';

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

export const setActiveTool = payload => ({
  type: SET_ACTIVE_TOOL,
  payload,
});
