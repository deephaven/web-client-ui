import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  UserOverrideContext,
  UserPermissionsOverrideContext,
} from '@deephaven/auth-plugins';
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
import {
  DecimalColumnFormatter,
  getSessionDetails,
  IntegerColumnFormatter,
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
  setWorkspaceStorage as setWorkspaceStorageAction,
  setServerConfigValues as setServerConfigValuesAction,
  User,
  Workspace,
  WorkspaceStorage,
  ServerConfigValues,
  DeephavenPluginModuleMap,
} from '@deephaven/redux';
import { useConnection, usePlugins } from '@deephaven/app-utils';
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

  setActiveTool: (type: typeof ToolType[keyof typeof ToolType]) => void;
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
  setPlugins: (map: DeephavenPluginModuleMap) => void;
  setUser: (user: User) => void;
  setWorkspace: (workspace: Workspace) => void;
  setWorkspaceStorage: (workspaceStorage: WorkspaceStorage) => void;
  setServerConfigValues: (config: ServerConfigValues) => void;
}

/**
 * Component that sets some default values needed
 */
function AppInit(props: AppInitProps) {
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
    setServerConfigValues,
  } = props;

  const api = useApi();
  const client = useClient();
  const connection = useConnection();
  const plugins = usePlugins();
  const userOverrides = useContext(UserOverrideContext);
  const userPermissionsOverrides = useContext(UserPermissionsOverrideContext);

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
      async function loadApp() {
        try {
          const sessionDetails = await getSessionDetails();
          const sessionWrapper = await loadSessionWrapper(
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

          const [configs, loadedWorkspace] = await Promise.all([
            client.getServerConfigValues(),
            workspaceStorage.load({
              isConsoleAvailable: sessionWrapper !== undefined,
            }),
          ]);

          const { data } = loadedWorkspace;

          // Fill in settings that have not yet been set
          const { settings } = data;
          if (settings.defaultDecimalFormatOptions === undefined) {
            settings.defaultDecimalFormatOptions = {
              defaultFormatString: DecimalColumnFormatter.DEFAULT_FORMAT_STRING,
            };
          }

          if (settings.defaultIntegerFormatOptions === undefined) {
            settings.defaultIntegerFormatOptions = {
              defaultFormatString: IntegerColumnFormatter.DEFAULT_FORMAT_STRING,
            };
          }

          if (settings.truncateNumbersWithPound === undefined) {
            settings.truncateNumbersWithPound = false;
          }

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

          const serverConfig = new Map(configs);

          const name = '';
          const user: User = {
            name,
            operateAs: name,
            groups: [],
            ...userOverrides,
            permissions: {
              isACLEditor: false,
              isSuperUser: false,
              isQueryViewOnly: false,
              isNonInteractive: false,
              canUsePanels: true,
              canCreateDashboard: true,
              canCreateCodeStudio: true,
              canCreateQueryMonitor: true,
              canCopy: !(
                serverConfig.get('internal.webClient.appInit.canCopy') ===
                'false'
              ),
              canDownloadCsv: !(
                serverConfig.get(
                  'internal.webClient.appInit.canDownloadCsv'
                ) === 'false'
              ),
              canLogout: true,
              ...userPermissionsOverrides,
            },
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
      setWorkspaceStorage,
      setServerConfigValues,
      userOverrides,
      userPermissionsOverrides,
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

const mapStateToProps = (state: RootState) => ({
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
  setWorkspaceStorage: setWorkspaceStorageAction,
  setServerConfigValues: setServerConfigValuesAction,
})(AppInit);

export default ConnectedAppInit;
