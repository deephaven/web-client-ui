import React, { PureComponent } from 'react';
import { Grid, MockGridModel, MockTreeGridModel } from '@deephaven/grid';
import IrisGrid from '@deephaven/iris-grid/dist/IrisGrid';
import MockIrisGridTreeModel from './MockIrisGridTreeModel';

class Grids extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      irisGridModel: new MockIrisGridTreeModel(new MockTreeGridModel()),
      model: new MockGridModel(),
      theme: { autoSelectRow: true },
      treeModel: new MockTreeGridModel(),
      treeTheme: { autoSelectRow: true },
    };
  }

  render() {
    const { irisGridModel, model, theme, treeModel, treeTheme } = this.state;

    return (
      <div>
        <h2 className="ui-title">Grid</h2>
        <div style={{ height: 500 }}>
          <Grid model={model} theme={theme} />
        </div>
        <h2 className="ui-title">Tree Grid</h2>
        <div style={{ height: 500 }}>
          <Grid model={treeModel} theme={treeTheme} />
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
