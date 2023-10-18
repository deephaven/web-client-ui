import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import {
  LoadingOverlay,
  preloadTheme,
  ThemeData,
  ThemeProvider,
} from '@deephaven/components';
import { ApiBootstrap } from '@deephaven/jsapi-bootstrap';
import logInit from '../log/LogInit';

logInit();

preloadTheme();

// Provide a non-null array to ThemeProvider to tell it to initialize
const customThemes: ThemeData[] = [];

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

ReactDOM.render(
  <ApiBootstrap apiUrl={apiURL.href} setGlobally>
    <Suspense fallback={<LoadingOverlay />}>
      <ThemeProvider themes={customThemes}>
        <FontBootstrap>
          <StyleGuideRoot />
        </FontBootstrap>
      </ThemeProvider>
    </Suspense>
  </ApiBootstrap>,
  document.getElementById('root')
);
