import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import 'bootstrap';
import 'fira';
// This must be before MonacoUtils so MenuItem styling is correct
// Best guess is something to do with webpack/CRA order of resolution/deduping
import './index.scss';
import { MonacoUtils } from '@deephaven/console';
import { store } from '@deephaven/redux';
import AppRouter from './main/AppRouter';
import DownloadServiceWorkerUtils from './DownloadServiceWorkerUtils';
import logInit from './log/LogInit.ts';
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
window['__react-beautiful-dnd-disable-dev-warnings'] = true;
