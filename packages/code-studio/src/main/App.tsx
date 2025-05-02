import React, { type ReactElement } from 'react';
import { ContextMenuRoot, ToastContainer } from '@deephaven/components';
import AppMainContainer from './AppMainContainer';

function App(): ReactElement {
  return (
    <div className="app">
      <AppMainContainer />
      <ContextMenuRoot />
      <ToastContainer />
    </div>
  );
}

export default App;
