import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import 'fira';
// eslint-disable-next-line import/no-unresolved
import '@deephaven/components/dist/BaseStyleSheet.css';
import { MonacoUtils } from '@deephaven/console';
import { store } from '@deephaven/redux';
import AppRouter from './main/AppRouter';
import DownloadServiceWorkerUtils from './DownloadServiceWorkerUtils';
import logInit from './log/LogInit';
import { unregister } from './serviceWorker';

logInit();

ReactDOM.render(
  <Provider store={store}>
    <AppRouter />
  </Provider>,
  document.getElementById('root')
);
unregister();
DownloadServiceWorkerUtils.registerOnLoaded();
MonacoUtils.init();

// disable annoying dnd-react warnings
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window['__react-beautiful-dnd-disable-dev-warnings'] = true;
