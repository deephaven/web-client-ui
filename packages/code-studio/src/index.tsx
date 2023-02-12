import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import 'fira';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import { LoadingOverlay } from '@deephaven/components';
import { ApiBootstrap } from '@deephaven/jsapi-bootstrap';
import logInit from './log/LogInit';

logInit();

const AppRoot = React.lazy(() => import('./AppRoot'));

ReactDOM.render(
  <ApiBootstrap
    apiUrl={`${import.meta.env.VITE_CORE_API_URL}/${
      import.meta.env.VITE_CORE_API_NAME
    }`}
    setGlobally
  >
    <Suspense fallback={<LoadingOverlay />}>
      <AppRoot />
    </Suspense>
  </ApiBootstrap>,
  document.getElementById('root')
);
