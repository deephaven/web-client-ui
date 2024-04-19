import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDashboards, useConnection, useUser } from '@deephaven/app-utils';
import type GoldenLayout from '@deephaven/golden-layout';
import type { ItemConfigType } from '@deephaven/golden-layout';
import {
  ContextMenuRoot,
  ErrorBoundary,
  LoadingOverlay,
} from '@deephaven/components'; // Use the loading spinner from the Deephaven components package
import type { dh } from '@deephaven/jsapi-types';
import { fetchVariableDefinition } from '@deephaven/jsapi-utils';
import Log from '@deephaven/log';
import {
  usePlugins,
  isDashboardPlugin,
  isLegacyDashboardPlugin,
  type DashboardPlugin,
  type LegacyDashboardPlugin,
} from '@deephaven/plugin';
import { PanelEvent, getAllDashboardsData } from '@deephaven/dashboard';
import { getVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import { EMPTY_ARRAY } from '@deephaven/utils';
import { setUser } from '@deephaven/redux';
import './App.scss'; // Styles for in this app

const log = Log.module('EmbedWidget.App');

/**
 * A functional React component that displays a Deephaven Widget using the @deephaven/plugin package.
 * It will attempt to open and display the widget specified with the `name` parameter, expecting it to be present on the server.
 * E.g. http://localhost:4030/?name=myWidget will attempt to open a widget `myWidget`
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
  const connection = useConnection();

  useEffect(
    function initializeApp() {
      async function initApp(): Promise<void> {
        try {
          if (name == null) {
            throw new Error('Missing URL parameter "name"');
          }

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
    [connection, name]
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

  const [gl, setGl] = useState<GoldenLayout | null>(null);

  const handleGoldenLayoutChange = useCallback((newLayout: GoldenLayout) => {
    setGl(newLayout);
  }, []);

  const handleDashboardInitialized = useCallback(() => {
    if (gl == null || definition == null) {
      log.debug2('this is a test');
      return;
    }
    gl.eventHub.emit(PanelEvent.OPEN, {
      fetch,
      widget: getVariableDescriptor(definition),
    });
  }, [gl, definition, fetch]);

  const allDashboardData = useSelector(getAllDashboardsData);

  const plugins = usePlugins();

  const dashboardPlugins = useMemo(() => {
    const dbPlugins = [...plugins.entries()].filter(
      ([, plugin]) =>
        isDashboardPlugin(plugin) || isLegacyDashboardPlugin(plugin)
    ) as [string, DashboardPlugin | LegacyDashboardPlugin][];

    return dbPlugins.map(([pluginName, plugin]) => {
      if (isLegacyDashboardPlugin(plugin)) {
        const { DashboardPlugin: DPlugin } = plugin;
        return <DPlugin key={pluginName} />;
      }

      const { component: DPlugin } = plugin;
      return <DPlugin key={pluginName} />;
    });
  }, [plugins]);

  const layoutConfig = (allDashboardData['a']?.layoutConfig ??
    EMPTY_ARRAY) as ItemConfigType[];

  const hasMultipleComponents = useMemo(() => {
    function getComponentCount(config: ItemConfigType[]) {
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
  // some race conditions
  useEffect(() => {
    if (gl != null) {
      if (hasMultipleComponents) {
        gl.enableHeaders();
      } else {
        gl.disableHeaders();
      }
    }
  }, [hasMultipleComponents, gl]);

  const layoutSettings = useMemo(
    () => ({
      hasHeaders: true,
      defaultComponentConfig: { isClosable: false },
    }),
    []
  );

  const user = useUser();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setUser(user));
  }, [dispatch, user]);

  return (
    <div className="App">
      {isLoaded && (
        <ErrorBoundary>
          <AppDashboards
            dashboards={[
              {
                id: 'a',
                layoutConfig,
                layoutSettings,
              },
            ]}
            activeDashboard="a"
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
