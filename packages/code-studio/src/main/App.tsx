import React, { type ReactElement } from 'react';
import { ToastContainer } from '@deephaven/components';
import AppMainContainer from './AppMainContainer';

function App(): ReactElement {
  return (
    <div className="app" data-testid="app-loaded">
      <AppMainContainer />
      <ToastContainer />
    </div>
  );
}

export default App;
