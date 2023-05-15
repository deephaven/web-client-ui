import React, { ReactElement, useState } from 'react';
import {
  Grid,
  GridThemeType,
  MockGridModel,
  MockTreeGridModel,
  ThemeContext,
} from '@deephaven/grid';
import { IrisGrid } from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import MockIrisGridTreeModel from './MockIrisGridTreeModel';
import StaticExample from './grid-examples/StaticExample';
import QuadrillionExample from './grid-examples/QuadrillionExample';
import TreeExample from './grid-examples/TreeExample';
import AsyncExample from './grid-examples/AsyncExample';
import DataBarExample from './grid-examples/DataBarExample';

function Grids(): ReactElement {
  const dh = useApi();
  const [irisGridModel] = useState(
    new MockIrisGridTreeModel(dh, new MockTreeGridModel())
  );
  const [model] = useState(new MockGridModel());
  const [theme] = useState<Partial<GridThemeType>>({ autoSelectRow: true });
  const [contextTheme] = useState<Partial<GridThemeType>>({ rowHeight: 40 });

  return (
    <div>
      <ThemeContext.Provider value={contextTheme}>
        <h2 className="ui-title">Grid</h2>
        <div>
          <Grid model={model} theme={theme} />
        </div>
        <h2 className="ui-title">Static Data</h2>
        <div style={{ height: 200 }}>
          <StaticExample />
        </div>
        <h2 className="ui-title">Data Bar</h2>
        <div style={{ height: 500 }}>
          <DataBarExample />
        </div>
        <h2 className="ui-title">Quadrillion rows and columns</h2>
        <div style={{ height: 500, position: 'relative' }}>
          <QuadrillionExample />
        </div>
        <h2 className="ui-title">Async example</h2>
        <div style={{ height: 500, position: 'relative' }}>
          <AsyncExample />
        </div>
        <h2 className="ui-title">Tree Grid</h2>
        <div style={{ height: 500 }}>
          <TreeExample />
        </div>
        <h2 className="ui-title">Iris Grid</h2>
        <div style={{ height: 500 }}>
          <IrisGrid dh={dh} model={irisGridModel} />
        </div>
      </ThemeContext.Provider>
    </div>
  );
}

export default Grids;
