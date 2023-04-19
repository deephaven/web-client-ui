import { LoadingOverlay } from '@deephaven/components';
import { ApiBootstrap } from '@deephaven/jsapi-bootstrap';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import logInit from './log/LogInit';

logInit();

// eslint-disable-next-line react-refresh/only-export-components
const AppRoot = React.lazy(() => import('./AppRoot'));

// eslint-disable-next-line react-refresh/only-export-components
const AppBootstrap = React.lazy(async () => {
  const module = await import('@deephaven/app-utils');
  return { default: module.AppBootstrap };
});

const apiUrl = `${import.meta.env.VITE_CORE_API_URL}/${
  import.meta.env.VITE_CORE_API_NAME
}`;

ReactDOM.render(
  <ApiBootstrap apiUrl={apiUrl} setGlobally>
    <Suspense fallback={<LoadingOverlay />}>
      <AppBootstrap
        baseUrl={import.meta.env.BASE_URL}
        apiUrl={import.meta.env.VITE_CORE_API_URL}
        pluginsUrl={import.meta.env.VITE_MODULE_PLUGINS_URL}
      >
        <AppRoot />
      </AppBootstrap>
    </Suspense>
  </ApiBootstrap>,
  document.getElementById('root')
);
