import React from 'react';
import { Provider } from 'react-redux';
import { Provider as SpectrumProvider } from '@adobe/react-spectrum';
import { themeDHDefault } from '@deephaven/components';
import { MonacoUtils } from '@deephaven/console';
import { store } from '@deephaven/redux';
import MonacoWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import AppRouter from './main/AppRouter';
import DownloadServiceWorkerUtils from './DownloadServiceWorkerUtils';

export function AppRoot(): JSX.Element {
  DownloadServiceWorkerUtils.registerOnLoaded();
  MonacoUtils.init({ getWorker: () => new MonacoWorker() });

  // disable annoying dnd-react warnings
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window['__react-beautiful-dnd-disable-dev-warnings'] = true;

  return (
    <Provider store={store}>
      {/* TODO: Remove this SpectrumProvider. Brian will be implementing it with his changes. */}
      <SpectrumProvider
        UNSAFE_style={{ backgroundColor: 'transparent' }}
        colorScheme="dark"
        theme={themeDHDefault}
      >
        <AppRouter />
      </SpectrumProvider>
    </Provider>
  );
}

export default AppRoot;
