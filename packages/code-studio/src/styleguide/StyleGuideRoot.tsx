import React from 'react';
import { Provider } from 'react-redux';
import { FontBootstrap } from '@deephaven/app-utils';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import { MonacoUtils } from '@deephaven/console';
import { store } from '@deephaven/redux';
import MonacoWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import DownloadServiceWorkerUtils from '../DownloadServiceWorkerUtils';
import StyleGuideInit from './StyleGuideInit';

export function StyleGuideRoot() {
  DownloadServiceWorkerUtils.registerOnLoaded();
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
