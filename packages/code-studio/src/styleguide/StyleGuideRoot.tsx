import React from 'react';
import { Provider } from 'react-redux';
import { FontBootstrap } from '@deephaven/app-utils';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import { MonacoUtils } from '@deephaven/console';
import { store } from '@deephaven/redux';
import { DownloadServiceWorkerUtils } from '@deephaven/iris-grid';
import MonacoWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import StyleGuideInit from './StyleGuideInit';

export function StyleGuideRoot(): JSX.Element {
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
    <FontBootstrap>
      <Provider store={store}>
        <StyleGuideInit />
      </Provider>
    </FontBootstrap>
  );
}

export default StyleGuideRoot;
