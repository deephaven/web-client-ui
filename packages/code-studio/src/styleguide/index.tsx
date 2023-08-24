import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import {
  LoadingOverlay,
  CreateThemeContext,
  ThemeProvider,
} from '@deephaven/components';
import { ApiBootstrap } from '@deephaven/jsapi-bootstrap';
import logInit from '../log/LogInit';

logInit();

// eslint-disable-next-line react-refresh/only-export-components
const StyleGuideRoot = React.lazy(() => import('./StyleGuideRoot'));

// eslint-disable-next-line react-refresh/only-export-components
const FontBootstrap = React.lazy(async () => {
  const module = await import('@deephaven/app-utils');
  return { default: module.FontBootstrap };
});

const apiURL = new URL(
  `${import.meta.env.VITE_CORE_API_URL}/${import.meta.env.VITE_CORE_API_NAME}`,
  document.baseURI
);

const App = function App() {
  return (
    <ApiBootstrap apiUrl={apiURL.href} setGlobally>
      <Suspense fallback={<LoadingOverlay />}>
        <FontBootstrap>
          <CreateThemeContext>
            <ThemeProvider>
              <StyleGuideRoot />
            </ThemeProvider>
          </CreateThemeContext>
        </FontBootstrap>
      </Suspense>
    </ApiBootstrap>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
