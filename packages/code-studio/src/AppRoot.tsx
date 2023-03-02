import React from 'react';
import { Provider } from 'react-redux';
import { MonacoUtils } from '@deephaven/console';
import { store } from '@deephaven/redux';
import MonacoWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import AppRouter from './main/AppRouter';
import DownloadServiceWorkerUtils from './DownloadServiceWorkerUtils';
import { unregister } from './serviceWorker';

export function AppRoot() {
  unregister();
  DownloadServiceWorkerUtils.registerOnLoaded();
  MonacoUtils.init({ getWorker: () => new MonacoWorker() });

  // disable annoying dnd-react warnings
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window['__react-beautiful-dnd-disable-dev-warnings'] = true;

  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
}

export default AppRoot;
