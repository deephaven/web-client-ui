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

const App = React.lazy(() => import('./App'));

ReactDOM.render(
  <ApiBootstrap
    apiUrl={`${import.meta.env.VITE_CORE_API_URL}/${
      import.meta.env.VITE_CORE_API_NAME
    }`}
    setGlobally
  >
    <Suspense fallback={<LoadingOverlay />}>
      <App />
    </Suspense>
  </ApiBootstrap>,
  document.getElementById('root')
);
