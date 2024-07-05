import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LoadingOverlay,
  Shortcut,
  ShortcutRegistry,
} from '@deephaven/components';
import { DEFAULT_DASHBOARD_ID, setDashboardData } from '@deephaven/dashboard';
import {
  setDashboardConnection,
  setDashboardSessionWrapper,
  ToolType,
} from '@deephaven/dashboard-core-plugins';
import { useApi, useClient } from '@deephaven/jsapi-bootstrap';
import { getSessionDetails, loadSessionWrapper } from '@deephaven/jsapi-utils';
import { FileStorage, FileStorageContext } from '@deephaven/file-explorer';
import Log from '@deephaven/log';
import { PouchCommandHistoryStorage } from '@deephaven/pouch-storage';
import {
  getWorkspace,
  RootState,
  setActiveTool,
  setApi,
  setCommandHistoryStorage,
  setFileStorage,
  setPlugins,
  setWorkspace,
  setDefaultWorkspaceSettings,
  setWorkspaceStorage,
  setServerConfigValues,
  setUser,
  getFileStorage,
} from '@deephaven/redux';
import {
  LocalWorkspaceStorage,
  GrpcFileStorage,
  GrpcLayoutStorage,
  useConnection,
  useServerConfig,
  useUser,
} from '@deephaven/app-utils';
import { usePlugins } from '@deephaven/plugin';
import { setLayoutStorage } from '../redux/actions';
import App from './App';

const log = Log.module('AppInit');

/**
 * Component that sets some default values needed
 */
function AppInit(): JSX.Element {
  const api = useApi();
  const client = useClient();
  const connection = useConnection();
  const plugins = usePlugins();
  const serverConfig = useServerConfig();
  const user = useUser();
  const workspace = useSelector<RootState>(getWorkspace);
  const fileStorage = useSelector<RootState>(
    getFileStorage
  ) as FileStorage | null;
  const dispatch = useDispatch();

  // General error means the app is dead and is unlikely to recover
  const [error, setError] = useState<unknown>();

  useEffect(
    function setReduxPlugins() {
      dispatch(setPlugins(plugins));
    },
    [plugins, dispatch]
  );

  useEffect(
    function initApp() {
      async function loadApp(): Promise<void> {
        try {
          const sessionDetails = await getSessionDetails();
          const sessionWrapper = await loadSessionWrapper(
            api,
            connection,
            sessionDetails
          );

          const fileSeparator = serverConfig.get('file.separator') ?? '/';
          const notebookRoot =
            serverConfig.get('web.storage.notebook.directory') ?? '';
          const layoutRoot =
            serverConfig.get('web.storage.layout.directory') ?? '';
          const storageService = client.getStorageService();
          const layoutStorage = new GrpcLayoutStorage(
            storageService,
            layoutRoot,
            fileSeparator
          );
          const grpcFileStorage = new GrpcFileStorage(
            api,
            storageService,
            notebookRoot,
            fileSeparator
          );

          const workspaceStorage = new LocalWorkspaceStorage(layoutStorage);
          const commandHistoryStorage = new PouchCommandHistoryStorage();

          const loadedWorkspace = await workspaceStorage.load({
            isConsoleAvailable: sessionWrapper !== undefined,
          });

          const { data } = loadedWorkspace;

          // Fill in settings that have not yet been set
          const { settings } = data;

          // Set any shortcuts that user has overridden on this platform
          const { shortcutOverrides = {} } = settings;
          const isMac = Shortcut.isMacPlatform;
          const platformOverrides = isMac
            ? shortcutOverrides.mac ?? {}
            : shortcutOverrides.windows ?? {};

          Object.entries(platformOverrides).forEach(([id, keyState]) => {
            ShortcutRegistry.get(id)?.setKeyState(keyState);
          });

          const dashboardData = {
            title: 'Code Studio',
            filterSets: data.filterSets,
            links: data.links,
          };

          dispatch(setApi(api));
          dispatch(setActiveTool(ToolType.DEFAULT));
          dispatch(setServerConfigValues(serverConfig));
          dispatch(setCommandHistoryStorage(commandHistoryStorage));
          dispatch(setDashboardData(DEFAULT_DASHBOARD_ID, dashboardData));
          dispatch(setFileStorage(grpcFileStorage));
          dispatch(setLayoutStorage(layoutStorage));
          dispatch(setDashboardConnection(DEFAULT_DASHBOARD_ID, connection));
          if (sessionWrapper !== undefined) {
            dispatch(
              setDashboardSessionWrapper(DEFAULT_DASHBOARD_ID, sessionWrapper)
            );
          }
          dispatch(setUser(user));
          dispatch(setWorkspaceStorage(workspaceStorage));
          dispatch(setWorkspace(loadedWorkspace));
          dispatch(
            setDefaultWorkspaceSettings(
              LocalWorkspaceStorage.makeDefaultWorkspaceSettings(serverConfig)
            )
          );
        } catch (e) {
          log.error(e);
          setError(e);
        }
      }
      loadApp();
    },
    [api, client, connection, serverConfig, dispatch, user]
  );

  const isLoading = workspace == null && error == null;
  const isLoaded = !isLoading && error == null;
  const errorMessage = error != null ? `${error}` : null;

  return (
    <FileStorageContext.Provider value={fileStorage}>
      {isLoaded && <App />}
      <LoadingOverlay
        isLoading={isLoading && errorMessage == null}
        isLoaded={isLoaded}
        errorMessage={errorMessage}
      />
    </FileStorageContext.Provider>
  );
}

export default AppInit;
