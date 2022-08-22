import React, { ReactElement } from 'react';
import { ContextMenuRoot } from '@deephaven/components';
import AppMainContainer from './AppMainContainer';

const App = (): ReactElement => (
  <div className="app">
    <AppMainContainer />
    <ContextMenuRoot />
  </div>
);

export default App;
