import React, { useCallback, useEffect, useState } from 'react';
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
  SessionWrapper,
  setDashboardConnection as setDashboardConnectionAction,
  setDashboardSessionWrapper as setDashboardSessionWrapperAction,
  ToolType,
} from '@deephaven/dashboard-core-plugins';
import { FileStorage } from '@deephaven/file-explorer';
import dh, { IdeConnection } from '@deephaven/jsapi-shim';
import {
  DecimalColumnFormatter,
  IntegerColumnFormatter,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { PouchCommandHistoryStorage } from '@deephaven/pouch-storage';
import {
  DeephavenPluginModuleMap,
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
import { setLayoutStorage as setLayoutStorageAction } from '../redux/actions';
import App from './App';
import LocalWorkspaceStorage from '../storage/LocalWorkspaceStorage';
import {
  createConnection,
  createCoreClient,
  createSessionWrapper,
} from './SessionUtils';
import { PluginUtils } from '../plugins';
import LayoutStorage from '../storage/LayoutStorage';
import { isNoConsolesError } from './NoConsolesError';
import GrpcLayoutStorage from '../storage/grpc/GrpcLayoutStorage';
import GrpcFileStorage from '../storage/grpc/GrpcFileStorage';

const log = Log.module('AppInit');

/**
 * Load all plugin modules available.
 * @returns A map from the name of the plugin to the plugin module that was loaded
 */
async function loadPlugins(): Promise<DeephavenPluginModuleMap> {
  log.debug('Loading plugins...');
  try {
    const manifest = await PluginUtils.loadJson(
      `${import.meta.env.VITE_MODULE_PLUGINS_URL}/manifest.json`
    );

    log.debug('Plugin manifest loaded:', manifest);
    const pluginPromises = [];
    for (let i = 0; i < manifest.plugins.length; i += 1) {
      const { name, main } = manifest.plugins[i];
      const pluginMainUrl = `${
        import.meta.env.VITE_MODULE_PLUGINS_URL
      }/${name}/${main}`;
      pluginPromises.push(PluginUtils.loadModulePlugin(pluginMainUrl));
    }
    const pluginModules = await Promise.all(pluginPromises);

    const pluginMap = new Map();
    for (let i = 0; i < pluginModules.length; i += 1) {
      const { name } = manifest.plugins[i];
      pluginMap.set(name, pluginModules[i]);
    }
    log.info('Plugins loaded:', pluginMap);

    return pluginMap;
  } catch (e) {
    log.error('Unable to load plugins:', e);
    return new Map();
  }
}

async function loadSessionWrapper(
  connection: IdeConnection
): Promise<SessionWrapper | undefined> {
  let sessionWrapper: SessionWrapper | undefined;
  try {
    sessionWrapper = await createSessionWrapper(connection);
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
const AppInit = (props: AppInitProps) => {
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

  const [error, setError] = useState<unknown>();
  const [isFontLoading, setIsFontLoading] = useState(true);

  const initClient = useCallback(async () => {
    try {
      log.info(
        'Initializing Web UI',
        import.meta.env.npm_package_version,
        navigator.userAgent
      );
      const newPlugins = await loadPlugins();
      const connection = createConnection();
      const sessionWrapper = await loadSessionWrapper(connection);
      connection.addEventListener(
        dh.IdeConnection.HACK_CONNECTION_FAILURE,
        event => {
          const { detail } = event;
          log.error('Connection failure', `${detail}`);
          setError(`Unable to connect:  ${detail.details ?? 'Unknown Error'}`);
        }
      );

      const name = 'user';

      const coreClient = createCoreClient();

      // Just login anonymously for now, use default user values
      await coreClient.login({ type: dh.CoreClient.LOGIN_TYPE_ANONYMOUS });

      const storageService = coreClient.getStorageService();
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

      const configs = await coreClient.getServerConfigValues();
      const serverConfig = new Map(configs);

      const user: User = {
        name,
        operateAs: name,
        groups: [],
        permissions: {
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
      setPlugins(newPlugins);
      setUser(user);
      setWorkspaceStorage(workspaceStorage);
      setWorkspace(loadedWorkspace);
    } catch (e: unknown) {
      log.error(e);
      setError(e);
    }
  }, [
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
  ]);

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

  const isLoading = (workspace == null && error == null) || isFontLoading;
  const isLoaded = !isLoading && error == null;
  const errorMessage = error != null ? `${error}` : null;

  return (
    <>
      {isLoaded && <App />}
      <LoadingOverlay
        isLoading={isLoading}
        isLoaded={isLoaded}
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
};

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

export default connect(mapStateToProps, {
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
