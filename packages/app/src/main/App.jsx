import React from 'react';
import { ContextMenuRoot } from '@deephaven/components';
import AppMainContainer from './AppMainContainer';

const App = () => (
  <div className="app">
    <AppMainContainer />
    <ContextMenuRoot />

    <div id="preload-fonts">
      {/* trigger loading of fonts needed by monaco and iris grid */}
      <p className="fira-sans-regular">preload</p>
      <p className="fira-sans-semibold">preload</p>
      <p className="fira-mono">preload</p>
    </div>
  </div>
);

App.propTypes = {};

export default App;
