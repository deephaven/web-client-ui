import React from 'react';
import { Provider } from 'react-redux';
import { MonacoUtils } from '@deephaven/console';
import { store } from '@deephaven/redux';
import MonacoWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import { CreateThemeContext, ThemeProvider } from '@deephaven/components';
import AppRouter from './main/AppRouter';
import DownloadServiceWorkerUtils from './DownloadServiceWorkerUtils';

export function AppRoot() {
  DownloadServiceWorkerUtils.registerOnLoaded();
  MonacoUtils.init({ getWorker: () => new MonacoWorker() });

  // disable annoying dnd-react warnings
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window['__react-beautiful-dnd-disable-dev-warnings'] = true;

  return (
    <CreateThemeContext>
      <ThemeProvider>
        <Provider store={store}>
          <AppRouter />
        </Provider>
      </ThemeProvider>
    </CreateThemeContext>
  );
}

export default AppRoot;
