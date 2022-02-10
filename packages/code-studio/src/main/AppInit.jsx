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
  setDashboardSessionWrapper as setDashboardSessionWrapperAction,
  ToolType,
} from '@deephaven/dashboard-core-plugins';
import { WebdavFileStorage } from '@deephaven/file-explorer';
import {
  DecimalColumnFormatter,
  IntegerColumnFormatter,
} from '@deephaven/iris-grid/dist/formatters';
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import {
  getWorkspace,
  getWorkspaceStorage,
  setActiveTool as setActiveToolAction,
  setCommandHistoryStorage as setCommandHistoryStorageAction,
  setFileStorage as setFileStorageAction,
  setPlugins as setPluginsAction,
  setUser as setUserAction,
  setWorkspace as setWorkspaceAction,
  setWorkspaceStorage as setWorkspaceStorageAction,
} from '@deephaven/redux';
import { createClient } from 'webdav/web';
import { setLayoutStorage as setLayoutStorageAction } from '../redux/actions';
import App from './App';
import PouchCommandHistoryStorage from '../storage/PouchCommandHistoryStorage';
import LocalWorkspaceStorage from '../storage/LocalWorkspaceStorage';
import WebdavLayoutStorage from './WebdavLayoutStorage';
import { createSessionWrapper } from './SessionUtils';
import UserLayoutUtils from './UserLayoutUtils';
import { PluginUtils } from '../plugins';

const log = Log.module('AppInit');

// Default values used
const NAME = 'user';
const USER = {
  name: NAME,
  operateAs: NAME,
  groups: [],
  permissions: {
    isSuperUser: false,
    isQueryViewOnly: false,
    isNonInteractive: false,
    canUsePanels: true,
    canCreateDashboard: true,
    canCreateCodeStudio: true,
    canCreateQueryMonitor: true,
    canCopy: true,
    canDownloadCsv: true,
  },
};
const WORKSPACE_STORAGE = new LocalWorkspaceStorage();
const COMMAND_HISTORY_STORAGE = new PouchCommandHistoryStorage();
const FILE_STORAGE = new WebdavFileStorage(
  createClient(process.env.REACT_APP_NOTEBOOKS_URL ?? '')
);
const LAYOUT_STORAGE = new WebdavLayoutStorage(
  createClient(process.env.REACT_APP_LAYOUTS_URL ?? '')
);
/**
 * Component that sets some default values needed
 */
const AppInit = props => {
  const {
    workspace,
    setActiveTool,
    setCommandHistoryStorage,
    setDashboardData,
    setFileStorage,
    setLayoutStorage,
    setDashboardSessionWrapper,
    setPlugins,
    setUser,
    setWorkspace,
    setWorkspaceStorage,
  } = props;

  const [error, setError] = useState();
  const [isFontLoading, setIsFontLoading] = useState(true);

  /**
   * Load all plugin modules available.
   * @returns {Promise<Map<string, DeephavenPlugin>>} A map from the name of the plugin to the plugin module that was loaded
   */
  const loadPlugins = useCallback(async () => {
    log.debug('Loading plugins...');
    try {
      const manifest = await PluginUtils.loadJson(
        `${process.env.REACT_APP_MODULE_PLUGINS_URL}/manifest.json`
      );

      log.debug('Plugin manifest loaded:', manifest);
      const pluginPromises = [];
      for (let i = 0; i < manifest.plugins.length; i += 1) {
        const { main } = manifest.plugins[i];
        const pluginMainUrl = `${process.env.REACT_APP_MODULE_PLUGINS_URL}/${main}`;
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
  }, []);

  const initClient = useCallback(async () => {
    try {
      const newPlugins = await loadPlugins();
      const loadedWorkspace = await WORKSPACE_STORAGE.load();
      const sessionWrapper = await createSessionWrapper();
      sessionWrapper.connection.addEventListener(
        dh.IdeConnection.HACK_CONNECTION_FAILURE,
        event => {
          const { detail } = event;
          log.error('Connection failure', detail);
          setError(`Unable to connect:  ${detail.details ?? 'Unknown Error'}`);
        }
      );

      const { data } = loadedWorkspace;
      if (data.layoutConfig == null) {
        // User doesn't have a saved layout yet, load the default
        const {
          filterSets,
          links,
          layoutConfig,
        } = await UserLayoutUtils.getDefaultLayout(LAYOUT_STORAGE);
        data.layoutConfig = layoutConfig;
        data.filterSets = filterSets;
        data.links = links;
      }

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

      // Set any shortcuts that user has overridden on this platform
      const { shortcutOverrides = {} } = settings;
      const isMac = Shortcut.isMacPlatform;
      const platformOverrides = isMac
        ? shortcutOverrides.mac ?? {}
        : shortcutOverrides.windows ?? {};

      Object.entries(platformOverrides).forEach(([id, keyState]) => {
        ShortcutRegistry.get(id)?.setKeyState(keyState);
      });

      const dashboardData = { filterSets: data.filterSets, links: data.links };

      setActiveTool(ToolType.DEFAULT);
      setCommandHistoryStorage(COMMAND_HISTORY_STORAGE);
      setDashboardData(DEFAULT_DASHBOARD_ID, dashboardData);
      setFileStorage(FILE_STORAGE);
      setLayoutStorage(LAYOUT_STORAGE);
      setDashboardSessionWrapper(DEFAULT_DASHBOARD_ID, sessionWrapper);
      setPlugins(newPlugins);
      setUser(USER);
      setWorkspaceStorage(WORKSPACE_STORAGE);
      setWorkspace(loadedWorkspace);
    } catch (e) {
      log.error(e);
      setError(e);
    }
  }, [
    loadPlugins,
    setActiveTool,
    setCommandHistoryStorage,
    setDashboardData,
    setFileStorage,
    setLayoutStorage,
    setDashboardSessionWrapper,
    setPlugins,
    setUser,
    setWorkspace,
    setWorkspaceStorage,
  ]);

  const initFonts = useCallback(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => {
        setIsFontLoading(false);
      });
    } else {
      // If document.fonts isn't supported, just best guess assume they're loaded
      setIsFontLoading(false);
    }
  }, []);

  useEffect(() => {
    initClient();
    initFonts();
  }, [initClient, initFonts]);

  const isLoading = (!workspace && !error) || isFontLoading;
  const isLoaded = !isLoading && !error;
  const errorMessage = error ? `${error}` : null;

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

const mapStateToProps = state => ({
  workspace: getWorkspace(state),
  workspaceStorage: getWorkspaceStorage(state),
});

export default connect(mapStateToProps, {
  setActiveTool: setActiveToolAction,
  setCommandHistoryStorage: setCommandHistoryStorageAction,
  setDashboardData: setDashboardDataAction,
  setFileStorage: setFileStorageAction,
  setLayoutStorage: setLayoutStorageAction,
  setDashboardSessionWrapper: setDashboardSessionWrapperAction,
  setPlugins: setPluginsAction,
  setUser: setUserAction,
  setWorkspace: setWorkspaceAction,
  setWorkspaceStorage: setWorkspaceStorageAction,
})(AppInit);
