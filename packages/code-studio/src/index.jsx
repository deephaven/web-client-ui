import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import 'fira';
import '@deephaven/components/dist/BaseStyleSheet.css';
import { MonacoUtils } from '@deephaven/console';
import dh from '@deephaven/jsapi-shim';
import { store } from '@deephaven/redux';
import AppRouter from './main/AppRouter';
import DownloadServiceWorkerUtils from './DownloadServiceWorkerUtils';
import logInit from './log/LogInit.ts';
import { unregister } from './serviceWorker';

logInit();

console.log('mjb adding window listeniner...');

window.addEventListener('mjb error', e => console.log('window error', e));

ReactDOM.render(
  dh ? (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  ) : (
    <div>API not found</div>
  ),
  document.getElementById('root')
);
unregister();
DownloadServiceWorkerUtils.registerOnLoaded();
MonacoUtils.init();

// disable annoying dnd-react warnings
window['__react-beautiful-dnd-disable-dev-warnings'] = true;
