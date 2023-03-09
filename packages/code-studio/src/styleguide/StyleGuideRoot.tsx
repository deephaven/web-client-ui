import React from 'react';
import { Provider } from 'react-redux';
import 'fira';
import '@deephaven/components/scss/BaseStyleSheet.scss';
import { MonacoUtils } from '@deephaven/console';
import { store } from '@deephaven/redux';
import MonacoWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import DownloadServiceWorkerUtils from '../DownloadServiceWorkerUtils';
import { unregister } from '../serviceWorker';
import StyleGuideInit from './StyleGuideInit';

export function StyleGuideRoot() {
  unregister();
  DownloadServiceWorkerUtils.registerOnLoaded();
  MonacoUtils.init({ getWorker: () => new MonacoWorker() });

  // disable annoying dnd-react warnings
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window['__react-beautiful-dnd-disable-dev-warnings'] = true;

  return (
    <Provider store={store}>
      <StyleGuideInit />
    </Provider>
  );
}

export default StyleGuideRoot;
