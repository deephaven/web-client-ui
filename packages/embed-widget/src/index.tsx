import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from '@deephaven/redux';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import { LoadingOverlay, preloadTheme } from '@deephaven/components';
import { ApiBootstrap } from '@deephaven/jsapi-bootstrap';

preloadTheme();

// Lazy load components for code splitting and also to avoid importing the jsapi-shim before API is bootstrapped.
// eslint-disable-next-line react-refresh/only-export-components
const App = React.lazy(() => import('./App'));

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

// Lazy load the configs because it breaks initial page loads otherwise
async function getCorePlugins() {
  const dashboardCorePlugins = await import(
    '@deephaven/dashboard-core-plugins'
  );
  const {
    GridPluginConfig,
    PandasPluginConfig,
    ChartPluginConfig,
    WidgetLoaderPluginConfig,
  } = dashboardCorePlugins;
  return [
    GridPluginConfig,
    PandasPluginConfig,
    ChartPluginConfig,
    WidgetLoaderPluginConfig,
  ];
}

ReactDOM.render(
  <ApiBootstrap apiUrl={apiURL.href} setGlobally>
    <Suspense fallback={<LoadingOverlay />}>
      <AppBootstrap
        getCorePlugins={getCorePlugins}
        serverUrl={apiURL.origin}
        pluginsUrl={pluginsURL.href}
      >
        <Provider store={store}>
          <App />
        </Provider>
      </AppBootstrap>
    </Suspense>
  </ApiBootstrap>,
  document.getElementById('root')
);
