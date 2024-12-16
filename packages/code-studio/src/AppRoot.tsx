import React from 'react';
import { Provider } from 'react-redux';
import { MonacoUtils } from '@deephaven/console';
import { store } from '@deephaven/redux';
import { DownloadServiceWorkerUtils } from '@deephaven/iris-grid';
import MonacoWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import AppRouter from './main/AppRouter';

export function AppRoot(): JSX.Element {
  DownloadServiceWorkerUtils.register(
    new URL(
      `${import.meta.env.BASE_URL ?? ''}download/serviceWorker.js`,
      window.location.href
    )
  );
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
