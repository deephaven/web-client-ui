import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  AuthPlugin,
  AuthPluginComponent,
  isAuthPlugin,
} from '@deephaven/auth-plugin';
import {
  AuthPluginAnonymous,
  AuthPluginParent,
  AuthPluginPsk,
} from '@deephaven/auth-core-plugins';
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
  SessionDetails,
  SessionWrapper,
  setDashboardConnection as setDashboardConnectionAction,
  setDashboardSessionWrapper as setDashboardSessionWrapperAction,
  ToolType,
} from '@deephaven/dashboard-core-plugins';
import { FileStorage } from '@deephaven/file-explorer';
import dh, { CoreClient, IdeConnection } from '@deephaven/jsapi-shim';
import {
  DecimalColumnFormatter,
  IntegerColumnFormatter,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { PouchCommandHistoryStorage } from '@deephaven/pouch-storage';
import {
  getWorkspace,
  getWorkspaceStorage,
  RootState,
  setActiveTool as setActiveToolAction,
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
} from '@deephaven/redux';
import {
  DeephavenPluginModuleMap,
  loadModulePlugins,
} from '@deephaven/plugin-utils';
import { setLayoutStorage as setLayoutStorageAction } from '../redux/actions';
import App from './App';
import LocalWorkspaceStorage from '../storage/LocalWorkspaceStorage';
import {
  createCoreClient,
  createSessionWrapper,
  getSessionDetails,
} from './SessionUtils';
import LayoutStorage from '../storage/LayoutStorage';
import { isNoConsolesError } from './NoConsolesError';
import GrpcLayoutStorage from '../storage/grpc/GrpcLayoutStorage';
import GrpcFileStorage from '../storage/grpc/GrpcFileStorage';

const log = Log.module('AppInit');

async function loadSessionWrapper(
  connection: IdeConnection,
  sessionDetails: SessionDetails
): Promise<SessionWrapper | undefined> {
  let sessionWrapper: SessionWrapper | undefined;
  try {
    sessionWrapper = await createSessionWrapper(connection, sessionDetails);
  } catch (e) {
    // Consoles may be disabled on the server, but we should still be able to start up and open existing objects
    if (!isNoConsolesError(e)) {
      throw e;
    }
  }
  return sessionWrapper;
}

interface AppInitProps {
  workspace: Workspace;
  workspaceStorage: WorkspaceStorage;

  setActiveTool: (type: typeof ToolType[keyof typeof ToolType]) => void;
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

  // General error means the app is dead and is unlikely to recover
  const [error, setError] = useState<unknown>();
  // Disconnect error may be temporary, so just show an error overlaid on the app
  const [isFontLoading, setIsFontLoading] = useState(true);
  const [client, setClient] = useState<CoreClient>();
  const [LoginPlugin, setLoginPlugin] = useState<AuthPluginComponent>();
  const [authConfigValues, setAuthConfigValues] = useState(
    new Map<string, string>()
  );

  const initClient = useCallback(async () => {
    const newClient = createCoreClient();
    try {
      log.info(
        'Initializing Web UI',
        import.meta.env.npm_package_version,
        navigator.userAgent
      );

      const [newAuthConfigValues, newPlugins] = await Promise.all([
        newClient.getAuthConfigValues().then(values => new Map(values)),
        loadModulePlugins(import.meta.env.VITE_MODULE_PLUGINS_URL),
      ]);
      const newAuthHandlers =
        newAuthConfigValues.get('AuthHandlers')?.split(',') ?? [];
      // Filter out all the plugins that are auth plugins, and then map them to [pluginName, AuthPlugin] pairs
      // Uses some pretty disgusting casting, because TypeScript wants to treat it as an (string | AuthPlugin)[] array instead
      const authPlugins = ([
        ...newPlugins.entries(),
      ].filter(([, plugin]: [string, { AuthPlugin?: AuthPlugin }]) =>
        isAuthPlugin(plugin.AuthPlugin)
      ) as [string, { AuthPlugin: AuthPlugin }][]).map(([name, plugin]) => [
        name,
        plugin.AuthPlugin,
      ]) as [string, AuthPlugin][];

      // Add all the core plugins in priority
      authPlugins.push(['AuthPluginPsk', AuthPluginPsk]);
      authPlugins.push(['AuthPluginParent', AuthPluginParent]);
      authPlugins.push(['AuthPluginAnonymous', AuthPluginAnonymous]);

      const availableAuthPlugins = authPlugins.filter(([name, authPlugin]) =>
        authPlugin.isAvailable(newClient, newAuthHandlers, newAuthConfigValues)
      );

      if (availableAuthPlugins.length === 0) {
        throw new Error(
          `No login plugins found, please register a login plugin for auth handlers: ${newAuthHandlers}`
        );
      } else if (availableAuthPlugins.length > 1) {
        log.warn(
          'More than one login plugin available, will use the first one: ',
          availableAuthPlugins.map(([name]) => name).join(', ')
        );
      }

      const [loginPluginName, NewLoginPlugin] = availableAuthPlugins[0];
      log.info('Using LoginPlugin', loginPluginName);

      setAuthConfigValues(newAuthConfigValues);
      setPlugins(newPlugins);
      setClient(newClient);
      setLoginPlugin(() => NewLoginPlugin.Component);
    } catch (e) {
      newClient.disconnect();
      log.error(e);
      setError(e);
    }
  }, [setPlugins]);

  const handleLoginSuccess = useCallback(() => {
    async function initApp() {
      if (client == null) {
        return;
      }
      try {
        const [connection, sessionDetails] = await Promise.all([
          client.getAsIdeConnection(),
          getSessionDetails(),
        ]);
        connection.addEventListener(dh.IdeConnection.EVENT_SHUTDOWN, event => {
          const { detail } = event;
          log.info('Shutdown', `${JSON.stringify(detail)}`);
          setError(`Server shutdown: ${detail ?? 'Unknown reason'}`);
        });

        const sessionWrapper = await loadSessionWrapper(
          connection,
          sessionDetails
        );
        const name = 'user';

        const storageService = client.getStorageService();
        const layoutStorage = new GrpcLayoutStorage(
          storageService,
          import.meta.env.VITE_LAYOUTS_URL ?? ''
        );
        const fileStorage = new GrpcFileStorage(
          storageService,
          import.meta.env.VITE_NOTEBOOKS_URL ?? ''
        );

        const workspaceStorage = new LocalWorkspaceStorage(layoutStorage);
        const commandHistoryStorage = new PouchCommandHistoryStorage();

        const loadedWorkspace = await workspaceStorage.load({
          isConsoleAvailable: sessionWrapper !== undefined,
        });
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

        const configs = await client.getServerConfigValues();
        const serverConfig = new Map(configs);

        const user: User = {
          name,
          operateAs: name,
          groups: [],
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
              serverConfig.get('internal.webClient.appInit.canCopy') === 'false'
            ),
            canDownloadCsv: !(
              serverConfig.get('internal.webClient.appInit.canDownloadCsv') ===
              'false'
            ),
          },
        };

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
    initApp();
  }, [
    client,
    setActiveTool,
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
  ]);

  const handleLoginFailure = useCallback((e: unknown) => {
    setError(e);
  }, []);

  const initFonts = useCallback(() => {
    if (document.fonts != null) {
      document.fonts.ready.then(() => {
        setIsFontLoading(false);
      });
    } else {
      // If document.fonts isn't supported, just best guess assume they're loaded
      setIsFontLoading(false);
    }
  }, []);

  useEffect(
    function initClientAndFonts() {
      initClient();
      initFonts();
    },
    [initClient, initFonts]
  );

  const isPluginLoading = LoginPlugin == null || isFontLoading;
  const isPluginLoaded = client != null && !isPluginLoading && error == null;
  const isAppLoading =
    (workspace == null && error == null) ||
    LoginPlugin == null ||
    isFontLoading;
  const isAppLoaded = !isAppLoading && error == null;
  const errorMessage = error != null ? `${error}` : null;

  return (
    <>
      {isAppLoaded && <App />}
      {isPluginLoaded && !isAppLoaded && (
        <LoginPlugin
          authConfigValues={authConfigValues}
          client={client}
          onSuccess={handleLoginSuccess}
          onFailure={handleLoginFailure}
        />
      )}
      <LoadingOverlay
        isLoading={isPluginLoading && errorMessage == null}
        isLoaded={isPluginLoaded}
        errorMessage={errorMessage}
      />
      {/*
      Need to preload any monaco and Deephaven grid fonts.
      We hide text with all the fonts we need on the root app.jsx page
      Load the Fira Mono font so that Monaco calculates word wrapping properly.
      This element doesn't need to be visible, just load the font and stay hidden.
      https://github.com/microsoft/vscode/issues/88689
      Can be replaced with a rel="preload" when firefox adds support
      https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content
       */}
      <div
        id="preload-fonts"
        style={{ visibility: 'hidden', position: 'absolute', top: -10000 }}
      >
        {/* trigger loading of fonts needed by monaco and iris grid */}
        <p className="fira-sans-regular">preload</p>
        <p className="fira-sans-semibold">preload</p>
        <p className="fira-mono">preload</p>
      </div>
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
