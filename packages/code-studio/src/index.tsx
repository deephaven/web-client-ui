import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import '@deephaven/components/scss/BaseStyleSheet.scss'; // Do NOT move any lower. This needs to be imported before any other styles
import { Provider } from 'react-redux';
import { LoadingOverlay, preloadTheme } from '@deephaven/components';
import { ApiBootstrap } from '@deephaven/jsapi-bootstrap';
import { store } from '@deephaven/redux';
import { logInit } from '@deephaven/log';

logInit(
  parseInt(import.meta.env.VITE_LOG_LEVEL ?? '', 10),
  import.meta.env.VITE_ENABLE_LOG_PROXY === 'true'
);

preloadTheme();

// Lazy load components for code splitting and also to avoid importing the jsapi-shim before API is bootstrapped.
// eslint-disable-next-line react-refresh/only-export-components
const AppRoot = React.lazy(() => import('./AppRoot'));

// eslint-disable-next-line react-refresh/only-export-components
const AppBootstrap = React.lazy(async () => {
  const module = await import('@deephaven/app-utils');
  return { default: module.AppBootstrap };
});

const apiURL = new URL(
  `${import.meta.env.VITE_CORE_API_URL}/${import.meta.env.VITE_CORE_API_NAME}`,
  document.baseURI
);

const pluginsURL = new URL(
  import.meta.env.VITE_MODULE_PLUGINS_URL,
  document.baseURI
);

const logMetadata: Record<string, unknown> = {
  uiVersion: import.meta.env.npm_package_version,
};

// Lazy load the configs because it breaks initial page loads otherwise
async function getCorePlugins() {
  const dashboardCorePlugins = await import(
    '@deephaven/dashboard-core-plugins'
  );
  const {
    GridPluginConfig,
    PandasPluginConfig,
    ChartPluginConfig,
    ChartBuilderPluginConfig,
    FilterPluginConfig,
    MarkdownPluginConfig,
    LinkerPluginConfig,
    WidgetLoaderPluginConfig,
  } = dashboardCorePlugins;
  return [
    GridPluginConfig,
    PandasPluginConfig,
    ChartPluginConfig,
    ChartBuilderPluginConfig,
    FilterPluginConfig,
    MarkdownPluginConfig,
    LinkerPluginConfig,
    WidgetLoaderPluginConfig,
  ];
}

ReactDOM.render(
  <ApiBootstrap apiUrl={apiURL.href} setGlobally>
    <Suspense fallback={<LoadingOverlay />}>
      <Provider store={store}>
        <AppBootstrap
          getCorePlugins={getCorePlugins}
          serverUrl={apiURL.origin}
          pluginsUrl={pluginsURL.href}
          logMetadata={logMetadata}
        >
          <AppRoot />
        </AppBootstrap>
      </Provider>
    </Suspense>
  </ApiBootstrap>,
  document.getElementById('root')
);
