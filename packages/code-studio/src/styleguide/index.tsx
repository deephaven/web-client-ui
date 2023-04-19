import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import { LoadingOverlay } from '@deephaven/components';
import { ApiBootstrap } from '@deephaven/jsapi-bootstrap';
import logInit from '../log/LogInit';

logInit();

// eslint-disable-next-line react-refresh/only-export-components
const StyleGuideRoot = React.lazy(() => import('./StyleGuideRoot'));

ReactDOM.render(
  <ApiBootstrap
    apiUrl={`${import.meta.env.VITE_CORE_API_URL}/${
      import.meta.env.VITE_CORE_API_NAME
    }`}
    setGlobally
  >
    <Suspense fallback={<LoadingOverlay />}>
      <StyleGuideRoot />
    </Suspense>
  </ApiBootstrap>,
  document.getElementById('root')
);
