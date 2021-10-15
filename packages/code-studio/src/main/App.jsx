import React from 'react';
import { ContextMenuRoot } from '@deephaven/components';
import AppMainContainer from './AppMainContainer';

const App = () => (
  <div className="app">
    <AppMainContainer />
    <ContextMenuRoot />
  </div>
);

export default App;
