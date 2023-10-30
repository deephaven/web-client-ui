import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  LoadingOverlay,
  Shortcut,
  ShortcutRegistry,
} from '@deephaven/components';
import {
  DEFAULT_DASHBOARD_ID,
  setDashboardData as setDashboardDataAction,
} from '@deephaven/dashboard';
import {
  setDashboardConnection as setDashboardConnectionAction,
  setDashboardSessionWrapper as setDashboardSessionWrapperAction,
  ToolType,
} from '@deephaven/dashboard-core-plugins';
import { FileStorage } from '@deephaven/file-explorer';
import { useApi, useClient } from '@deephaven/jsapi-bootstrap';
import type { dh as DhType, IdeConnection } from '@deephaven/jsapi-types';
import { useConnection } from '@deephaven/jsapi-components';
import {
  getSessionDetails,
  loadSessionWrapper,
  SessionWrapper,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { PouchCommandHistoryStorage } from '@deephaven/pouch-storage';
import {
  getWorkspace,
  getWorkspaceStorage,
  RootState,
  setActiveTool as setActiveToolAction,
  setApi as setApiAction,
  setCommandHistoryStorage as setCommandHistoryStorageAction,
  setFileStorage as setFileStorageAction,
  setPlugins as setPluginsAction,
  setUser as setUserAction,
  setWorkspace as setWorkspaceAction,
  setDefaultWorkspaceSettings as setDefaultWorkspaceSettingsAction,
  setWorkspaceStorage as setWorkspaceStorageAction,
  setServerConfigValues as setServerConfigValuesAction,
  User,
  Workspace,
  WorkspaceStorage,
  ServerConfigValues,
  WorkspaceSettings,
  CustomizableWorkspace,
} from '@deephaven/redux';
import { useServerConfig, useUser } from '@deephaven/app-utils';
import { type PluginModuleMap, usePlugins } from '@deephaven/plugin';
import { setLayoutStorage as setLayoutStorageAction } from '../redux/actions';
import App from './App';
import LocalWorkspaceStorage from '../storage/LocalWorkspaceStorage';
import LayoutStorage from '../storage/LayoutStorage';
import GrpcLayoutStorage from '../storage/grpc/GrpcLayoutStorage';
import GrpcFileStorage from '../storage/grpc/GrpcFileStorage';

const log = Log.module('AppInit');

interface AppInitProps {
  workspace: Workspace;
  workspaceStorage: WorkspaceStorage;

  setActiveTool: (type: (typeof ToolType)[keyof typeof ToolType]) => void;
  setApi: (api: DhType) => void;
  setCommandHistoryStorage: (storage: PouchCommandHistoryStorage) => void;
  setDashboardData: (
    id: string,
    dashboardData: Record<string, unknown>
  ) => void;
  setFileStorage: (fileStorage: FileStorage) => void;
  setLayoutStorage: (layoutStorage: LayoutStorage) => void;
  setDashboardConnection: (id: string, connection: IdeConnection) => void;
  setDashboardSessionWrapper: (id: string, wrapper: SessionWrapper) => void;
  setPlugins: (map: PluginModuleMap) => void;
  setUser: (user: User) => void;
  setWorkspace: (workspace: CustomizableWorkspace) => void;
  setDefaultWorkspaceSettings: (settings: WorkspaceSettings) => void;
  setWorkspaceStorage: (workspaceStorage: WorkspaceStorage) => void;
  setServerConfigValues: (config: ServerConfigValues) => void;
}

/**
 * Component that sets some default values needed
 */
function AppInit(props: AppInitProps): JSX.Element {
  const {
    workspace,
    setActiveTool,
    setApi,
    setCommandHistoryStorage,
    setDashboardData,
    setFileStorage,
    setLayoutStorage,
    setDashboardConnection,
    setDashboardSessionWrapper,
    setPlugins,
    setUser,
    setWorkspace,
    setWorkspaceStorage,
    setDefaultWorkspaceSettings,
    setServerConfigValues,
  } = props;

  const api = useApi();
  const client = useClient();
  const connection = useConnection();
  const plugins = usePlugins();
  const serverConfig = useServerConfig();
  const user = useUser();

  // General error means the app is dead and is unlikely to recover
  const [error, setError] = useState<unknown>();

  useEffect(
    function setReduxPlugins() {
      setPlugins(plugins);
    },
    [plugins, setPlugins]
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
            storageService,
            import.meta.env.VITE_STORAGE_PATH_NOTEBOOKS ?? ''
          );

          const workspaceStorage = new LocalWorkspaceStorage(layoutStorage);
          const commandHistoryStorage = new PouchCommandHistoryStorage();

          const loadedWorkspace = await workspaceStorage.load(
            {
              isConsoleAvailable: sessionWrapper !== undefined,
            },
            serverConfig
          );

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
            filterSets: data.filterSets,
            links: data.links,
          };

          setApi(api);
          setActiveTool(ToolType.DEFAULT);
          setServerConfigValues(serverConfig);
          setCommandHistoryStorage(commandHistoryStorage);
          setDashboardData(DEFAULT_DASHBOARD_ID, dashboardData);
          setFileStorage(fileStorage);
          setLayoutStorage(layoutStorage);
          setDashboardConnection(DEFAULT_DASHBOARD_ID, connection);
          if (sessionWrapper !== undefined) {
            setDashboardSessionWrapper(DEFAULT_DASHBOARD_ID, sessionWrapper);
          }
          setUser(user);
          setWorkspaceStorage(workspaceStorage);
          setDefaultWorkspaceSettings(
            LocalWorkspaceStorage.makeDefaultWorkspaceSettings()
          );
          setWorkspace(loadedWorkspace);
        } catch (e) {
          log.error(e);
          setError(e);
        }
      }
      loadApp();
    },
    [
      api,
      client,
      connection,
      serverConfig,
      setActiveTool,
      setApi,
      setCommandHistoryStorage,
      setDashboardData,
      setFileStorage,
      setLayoutStorage,
      setDashboardConnection,
      setDashboardSessionWrapper,
      setUser,
      setWorkspace,
      setDefaultWorkspaceSettings,
      setWorkspaceStorage,
      setServerConfigValues,
      user,
    ]
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

AppInit.propTypes = {
  workspace: PropTypes.shape({}),
  workspaceStorage: PropTypes.shape({ close: PropTypes.func }),

  setActiveTool: PropTypes.func.isRequired,
  setApi: PropTypes.func.isRequired,
  setCommandHistoryStorage: PropTypes.func.isRequired,
  setDashboardData: PropTypes.func.isRequired,
  setFileStorage: PropTypes.func.isRequired,
  setLayoutStorage: PropTypes.func.isRequired,
  setDashboardConnection: PropTypes.func.isRequired,
  setDashboardSessionWrapper: PropTypes.func.isRequired,
  setPlugins: PropTypes.func.isRequired,
  setUser: PropTypes.func.isRequired,
  setWorkspace: PropTypes.func.isRequired,
  setWorkspaceStorage: PropTypes.func.isRequired,
};

AppInit.defaultProps = {
  workspace: null,
  workspaceStorage: null,
};

const mapStateToProps = (
  state: RootState
): Pick<AppInitProps, 'workspace' | 'workspaceStorage'> => ({
  workspace: getWorkspace(state),
  workspaceStorage: getWorkspaceStorage(state),
});

const ConnectedAppInit = connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
  setApi: setApiAction,
  setCommandHistoryStorage: setCommandHistoryStorageAction,
  setDashboardData: setDashboardDataAction,
  setFileStorage: setFileStorageAction,
  setLayoutStorage: setLayoutStorageAction,
  setDashboardConnection: setDashboardConnectionAction,
  setDashboardSessionWrapper: setDashboardSessionWrapperAction,
  setPlugins: setPluginsAction,
  setUser: setUserAction,
  setWorkspace: setWorkspaceAction,
  setDefaultWorkspaceSettings: setDefaultWorkspaceSettingsAction,
  setWorkspaceStorage: setWorkspaceStorageAction,
  setServerConfigValues: setServerConfigValuesAction,
})(AppInit);

export default ConnectedAppInit;
