import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type { CommandHistoryStorage } from '@deephaven/console';
import type { FileStorage } from '@deephaven/file-explorer';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { PluginModuleMap } from '@deephaven/plugin';
import {
  SET_PLUGINS,
  SET_USER,
  SET_WORKSPACE,
  SET_COMMAND_HISTORY_STORAGE,
  SET_WORKSPACE_STORAGE,
  SET_ACTIVE_TOOL,
  SET_FILE_STORAGE,
  SET_SERVER_CONFIG_VALUES,
  SET_API,
  SET_DEFAULT_WORKSPACE_SETTINGS,
} from './actionTypes';
import type {
  CustomizableWorkspace,
  RootState,
  ServerConfigValues,
  User,
  WorkspaceSettings,
  WorkspaceStorage,
} from './store';

export interface PayloadAction<P = unknown> extends Action<string> {
  payload: P;
}

export type PayloadActionCreator<P> = (payload: P) => PayloadAction<P>;

export const setUser: PayloadActionCreator<User> = user => ({
  type: SET_USER,
  payload: user,
});

export const setApi: PayloadActionCreator<DhType> = api => ({
  type: SET_API,
  payload: api,
});

export const setWorkspace: PayloadActionCreator<
  CustomizableWorkspace
> = workspace => ({
  type: SET_WORKSPACE,
  payload: workspace,
});

export const setDefaultWorkspaceSettings: PayloadActionCreator<
  WorkspaceSettings
> = settings => ({
  type: SET_DEFAULT_WORKSPACE_SETTINGS,
  payload: {
    ...settings,
  },
});

export const setWorkspaceStorage: PayloadActionCreator<
  WorkspaceStorage
> = workspaceStorage => ({
  type: SET_WORKSPACE_STORAGE,
  payload: workspaceStorage,
});

export const setCommandHistoryStorage: PayloadActionCreator<
  CommandHistoryStorage
> = commandHistoryStorage => ({
  type: SET_COMMAND_HISTORY_STORAGE,
  payload: commandHistoryStorage,
});

export const setFileStorage: PayloadActionCreator<
  FileStorage
> = fileStorage => ({
  type: SET_FILE_STORAGE,
  payload: fileStorage,
});

/**
 * Sets the specified workspace locally and saves it remotely
 * @param workspace The workspace to save
 */
export const saveWorkspace =
  (
    workspace: CustomizableWorkspace
  ): ThunkAction<
    Promise<CustomizableWorkspace>,
    RootState,
    never,
    PayloadAction<unknown>
  > =>
  (dispatch, getState) => {
    dispatch(setWorkspace(workspace));
    const { storage } = getState();
    const { workspaceStorage } = storage;
    return workspaceStorage.save(workspace);
  };

/**
 * Update part of the workspace data and save it
 * @param workspaceData The properties to update in workspace data
 */
export const updateWorkspaceData =
  (
    workspaceData: Partial<CustomizableWorkspace['data']>
  ): ThunkAction<
    Promise<CustomizableWorkspace>,
    RootState,
    never,
    PayloadAction<unknown>
  > =>
  (dispatch, getState) => {
    const { workspace } = getState();
    const { data } = workspace;
    const newWorkspace = {
      ...workspace,
      data: {
        ...data,
        ...workspaceData,
        settings: {
          ...data.settings,
          ...workspaceData.settings,
        },
      },
    };
    return dispatch(saveWorkspace(newWorkspace));
  };

/**
 * Sets the specified settings locally and saves them remotely
 * @param settings The settings to save
 */
export const updateSettings =
  (
    settings: Partial<WorkspaceSettings>
  ): ThunkAction<
    Promise<CustomizableWorkspace>,
    RootState,
    never,
    PayloadAction<unknown>
  > =>
  dispatch =>
    dispatch(updateWorkspaceData({ settings }));
export const setActiveTool: PayloadActionCreator<string> = payload => ({
  type: SET_ACTIVE_TOOL,
  payload,
});

export const setPlugins: PayloadActionCreator<PluginModuleMap> = plugins => ({
  type: SET_PLUGINS,
  payload: plugins,
});

export const setServerConfigValues: PayloadActionCreator<
  ServerConfigValues
> = config => ({
  type: SET_SERVER_CONFIG_VALUES,
  payload: config,
});
