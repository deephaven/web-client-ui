import React, { ReactElement } from 'react';
import { ContextMenuRoot } from '@deephaven/components';
import AppMainContainer from './AppMainContainer';

function App(): ReactElement {
  return (
    <div className="app">
      <AppMainContainer />
      <ContextMenuRoot />
    </div>
  );
}

export default App;
