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
  const dispatch = useDispatch();

  // General error means the app is dead and is unlikely to recover
  const [error, setError] = useState<unknown>();

  useEffect(
    function setReduxPlugins() {
      setPlugins(plugins);
    },
    [plugins]
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

          const storageService = client.getStorageService();
          const layoutStorage = new GrpcLayoutStorage(
            storageService,
            import.meta.env.VITE_STORAGE_PATH_LAYOUTS ?? ''
          );
          const fileStorage = new GrpcFileStorage(
            api,
            storageService,
            import.meta.env.VITE_STORAGE_PATH_NOTEBOOKS ?? ''
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
          dispatch(setFileStorage(fileStorage));
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
    <>
      {isLoaded && <App />}
      <LoadingOverlay
        isLoading={isLoading && errorMessage == null}
        isLoaded={isLoaded}
        errorMessage={errorMessage}
      />
    </>
  );
}

export default AppInit;
