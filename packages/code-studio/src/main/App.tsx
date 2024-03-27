import React, { ReactElement } from 'react';
import { FormatSettingsBootstrap } from '@deephaven/app-utils';
import { ContextMenuRoot } from '@deephaven/components';
import AppMainContainer from './AppMainContainer';

function App(): ReactElement {
  return (
    <div className="app">
      <FormatSettingsBootstrap>
        <AppMainContainer />
        <ContextMenuRoot />
      </FormatSettingsBootstrap>
    </div>
  );
}

export default App;
