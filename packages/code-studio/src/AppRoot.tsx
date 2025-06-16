import React from 'react';
import { MonacoUtils } from '@deephaven/console';
import { DownloadServiceWorkerUtils } from '@deephaven/iris-grid';
import MonacoWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import MonacoJsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import AppRouter from './main/AppRouter';

// load addional css for playwright docker tests
if (import.meta.env.VITE_PLAYWRIGHT_CSS === '1') {
  await import('./Playwright.css');
}

export function AppRoot(): JSX.Element {
  DownloadServiceWorkerUtils.register(
    new URL(
      `${import.meta.env.BASE_URL ?? ''}download/serviceWorker.js`,
      window.location.href
    )
  );
  MonacoUtils.init({
    getWorker: (id: string, label: string) => {
      if (label === 'json') {
        return new MonacoJsonWorker();
      }
      return new MonacoWorker();
    },
  });

  // disable annoying dnd-react warnings
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window['__react-beautiful-dnd-disable-dev-warnings'] = true;

  return <AppRouter />;
}

export default AppRoot;
