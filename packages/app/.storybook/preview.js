import 'bootstrap';
import '../src/index.scss';
import '../src/styleguide/StyleGuide.scss';
import React from 'react';
import { Provider } from 'react-redux';
import store from '../src/redux/store';
import { unregister } from '../src/serviceWorker';
import DownloadServiceWorkerUtils from '../src/DownloadServiceWorkerUtils';
import MonacoUtils from '../src/monaco/MonacoUtils';
import { setWorkspace } from '../src/redux/actions';
import WorkspaceStorage from '../src/dashboard/WorkspaceStorage';

store.dispatch(setWorkspace(WorkspaceStorage.makeDefaultWorkspace()));
unregister();
DownloadServiceWorkerUtils.registerOnLoaded();
MonacoUtils.init();

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
};

export const decorators = [
  Story => (
    <Provider store={store}>
      <div className="style-guide-container">
        <Story />
      </div>
    </Provider>
  ),
];
