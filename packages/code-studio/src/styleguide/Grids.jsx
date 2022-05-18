import React, { PureComponent } from 'react';
import {
  Grid,
  MockGridModel,
  MockTreeGridModel,
  ThemeContext,
} from '@deephaven/grid';
import { IrisGrid } from '@deephaven/iris-grid';
import MockIrisGridTreeModel from './MockIrisGridTreeModel';
import StaticExample from './grid-examples/StaticExample';
import QuadrillionExample from './grid-examples/QuadrillionExample';
import TreeExample from './grid-examples/TreeExample';
import AsyncExample from './grid-examples/AsyncExample';

class Grids extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      irisGridModel: new MockIrisGridTreeModel(new MockTreeGridModel()),
      model: new MockGridModel(),
      theme: { autoSelectRow: true },
      contextTheme: { rowHeight: 40 },
    };
  }

  render() {
    const { contextTheme, irisGridModel, model, theme } = this.state;

    return (
      <div>
        <ThemeContext.Provider value={contextTheme}>
          <h2 className="ui-title">Grid</h2>
          <div style={{ height: 500 }}>
            <Grid model={model} theme={theme} />
          </div>
          <h2 className="ui-title">Static Data</h2>
          <div style={{ height: 200 }}>
            <StaticExample />
          </div>
        </ThemeContext.Provider>
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
          <IrisGrid model={irisGridModel} />
        </div>
      </div>
    );
  }
}

export default Grids;
