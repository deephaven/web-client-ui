import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { nanoid } from 'nanoid';
import {
  AppDashboards,
  GrpcLayoutStorage,
  LocalWorkspaceStorage,
  useConnection,
  useServerConfig,
  useUser,
} from '@deephaven/app-utils';
import type GoldenLayout from '@deephaven/golden-layout';
import type { ItemConfig } from '@deephaven/golden-layout';
import {
  ContextMenuRoot,
  ErrorBoundary,
  LoadingOverlay,
  Shortcut,
  ShortcutRegistry,
} from '@deephaven/components'; // Use the loading spinner from the Deephaven components package
import type { dh } from '@deephaven/jsapi-types';
import {
  fetchVariableDefinition,
  getSessionDetails,
  loadSessionWrapper,
} from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import { useDashboardPlugins } from '@deephaven/plugin';
import {
  getAllDashboardsData,
  listenForCreateDashboard,
  CreateDashboardPayload,
  setDashboardPluginData,
  stopListenForCreateDashboard,
  emitPanelOpen,
} from '@deephaven/dashboard';
import {
  getVariableDescriptor,
  useApi,
  useClient,
} from '@deephaven/jsapi-bootstrap';
import { EMPTY_ARRAY } from '@deephaven/utils';
import {
  setDefaultWorkspaceSettings,
  setWorkspace,
  setApi,
  setUser,
  setServerConfigValues,
} from '@deephaven/redux';
import './App.scss'; // Styles for in this app

const log = Log.module('EmbedWidget.App');

const LAYOUT_SETTINGS = {
  hasHeaders: true,
  defaultComponentConfig: { isClosable: false },
};

/**
 * A functional React component that displays a Deephaven Widget using the @deephaven/plugin package.
 * It will attempt to open and display the widget specified with the `name` parameter, expecting it to be present on the server.
 * E.g. http://localhost:4010/?name=myWidget will attempt to open a widget `myWidget` by emitting a `PanelEvent.OPEN` event.
 * If no query param is provided, it will display an error.
 * By default, tries to connect to the server defined in the VITE_CORE_API_URL variable, which is set to http://localhost:10000/jsapi
 * See Vite docs for how to update these env vars: https://vitejs.dev/guide/env-and-mode.html
 */
function App(): JSX.Element {
  const [error, setError] = useState<string>();
  const [definition, setDefinition] = useState<dh.ide.VariableDefinition>();
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  // Get the widget name from the query param `name`.
  const name = searchParams.get('name');
  const api = useApi();
  const connection = useConnection();
  const client = useClient();
  const user = useUser();
  const dispatch = useDispatch();
  const serverConfig = useServerConfig();

  useEffect(
    function initializeApp() {
      async function initApp(): Promise<void> {
        try {
          if (name == null) {
            throw new Error('Missing URL parameter "name"');
          }

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
          const workspaceStorage = new LocalWorkspaceStorage(layoutStorage);
          const loadedWorkspace = await workspaceStorage.load({
            isConsoleAvailable: sessionWrapper !== undefined,
          });
          const {
            data: { settings },
          } = loadedWorkspace;
          // Set any shortcuts that user has overridden on this platform
          const { shortcutOverrides = {} } = settings;
          const isMac = Shortcut.isMacPlatform;
          const platformOverrides = isMac
            ? shortcutOverrides.mac ?? {}
            : shortcutOverrides.windows ?? {};
          Object.entries(platformOverrides).forEach(([id, keyState]) => {
            ShortcutRegistry.get(id)?.setKeyState(keyState);
          });
          dispatch(setApi(api));
          dispatch(setServerConfigValues(serverConfig));
          dispatch(setUser(user));
          dispatch(setWorkspace(loadedWorkspace));
          dispatch(
            setDefaultWorkspaceSettings(
              LocalWorkspaceStorage.makeDefaultWorkspaceSettings(serverConfig)
            )
          );

          log.debug(`Loading widget definition for ${name}...`);

          const newDefinition = await fetchVariableDefinition(connection, name);

          setDefinition(newDefinition);

          log.debug(`Widget definition successfully loaded for ${name}`);
        } catch (e: unknown) {
          log.error(`Unable to load widget definition for ${name}`, e);
          setError(`${e}`);
        }
      }
      initApp();
    },
    [api, client, connection, dispatch, name, serverConfig, user]
  );

  const isLoaded = definition != null && error == null;
  const isLoading = definition == null && error == null;

  const fetch = useMemo(() => {
    if (definition == null) {
      return async () => {
        throw new Error('Definition is null');
      };
    }
    return () => connection.getObject(definition);
  }, [connection, definition]);

  const [goldenLayout, setGoldenLayout] = useState<GoldenLayout | null>(null);
  const [dashboardId, setDashboardId] = useState('default-embed-widget'); // Can't be DEFAULT_DASHBOARD_ID because its dashboard layout is not stored in dashboardData

  const handleGoldenLayoutChange = useCallback(
    (newLayout: GoldenLayout) => {
      function handleCreateDashboard({
        pluginId,
        data,
      }: CreateDashboardPayload) {
        const id = nanoid();
        dispatch(setDashboardPluginData(id, pluginId, data));
        setDashboardId(id);
      }

      setGoldenLayout(oldLayout => {
        if (oldLayout != null) {
          stopListenForCreateDashboard(
            oldLayout.eventHub,
            handleCreateDashboard
          );
        }
        listenForCreateDashboard(newLayout.eventHub, handleCreateDashboard);
        return newLayout;
      });
    },
    [dispatch]
  );

  const [hasEmittedWidget, setHasEmittedWidget] = useState(false);

  const handleDashboardInitialized = useCallback(() => {
    if (goldenLayout == null || definition == null || hasEmittedWidget) {
      return;
    }

    setHasEmittedWidget(true);
    emitPanelOpen(goldenLayout.eventHub, {
      fetch,
      widget: getVariableDescriptor(definition),
    });
  }, [goldenLayout, definition, fetch, hasEmittedWidget]);

  const allDashboardData = useSelector(getAllDashboardsData);

  const dashboardPlugins = useDashboardPlugins();

  const layoutConfig = (allDashboardData[dashboardId]?.layoutConfig ??
    EMPTY_ARRAY) as ItemConfig[];

  const hasMultipleComponents = useMemo(() => {
    function getComponentCount(config: ItemConfig[]) {
      if (config.length === 0) {
        return 0;
      }

      let count = 0;
      for (let i = 0; i < config.length; i += 1) {
        const item = config[i];
        if (item.type === 'react-component' || item.type === 'component') {
          count += 1;
        } else if (item.content != null) {
          count += getComponentCount(item.content);
        }
      }
      return count;
    }
    return getComponentCount(layoutConfig) > 1;
  }, [layoutConfig]);

  // Do this instead of changing layoutSettings because it will create
  // a new gl instance and can cause some loading failures likely due to
  // some race conditions w/ deephaven UI
  useEffect(
    function togglePanelHeaders() {
      if (goldenLayout != null) {
        if (hasMultipleComponents) {
          goldenLayout.enableHeaders();
        } else {
          goldenLayout.disableHeaders();
        }
      }
    },
    [hasMultipleComponents, goldenLayout]
  );

  return (
    <div className="App">
      {isLoaded && (
        <ErrorBoundary>
          <AppDashboards
            dashboards={[
              {
                id: dashboardId,
                layoutConfig,
                layoutSettings: LAYOUT_SETTINGS,
              },
            ]}
            activeDashboard={dashboardId}
            onLayoutInitialized={handleDashboardInitialized}
            onGoldenLayoutChange={handleGoldenLayoutChange}
            plugins={dashboardPlugins}
          />
        </ErrorBoundary>
      )}
      {!isLoaded && (
        <LoadingOverlay
          isLoaded={isLoaded}
          isLoading={isLoading}
          errorMessage={error ?? null}
        />
      )}
      <ContextMenuRoot />
    </div>
  );
}

export default App;
