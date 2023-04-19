import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';

// Fira fonts are not necessary, but look the best
import 'fira';

// Need to import the base style sheet for proper styling
// eslint-disable-next-line import/no-unresolved
import '@deephaven/components/scss/BaseStyleSheet.scss';
import { LoadingOverlay } from '@deephaven/components';
import { ApiBootstrap } from '@deephaven/jsapi-bootstrap';
import './index.scss';

// eslint-disable-next-line react-refresh/only-export-components
const App = React.lazy(() => import('./App'));

// eslint-disable-next-line react-refresh/only-export-components
const AppBootstrap = React.lazy(async () => {
  const module = await import('@deephaven/app-utils');
  return { default: module.AppBootstrap };
});

ReactDOM.render(
  <ApiBootstrap
    apiUrl={`${import.meta.env.VITE_CORE_API_URL}/${
      import.meta.env.VITE_CORE_API_NAME
    }`}
    setGlobally
  >
    <Suspense fallback={<LoadingOverlay />}>
      <AppBootstrap
        baseUrl={import.meta.env.BASE_URL}
        apiUrl={import.meta.env.VITE_CORE_API_URL}
        pluginsUrl={import.meta.env.VITE_MODULE_PLUGINS_URL}
      >
        <App />
      </AppBootstrap>
    </Suspense>
  </ApiBootstrap>,
  document.getElementById('root')
);
