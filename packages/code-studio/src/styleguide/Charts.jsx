import React, { PureComponent } from 'react';
import { Chart, MockChartModel } from '@deephaven/chart';

class Charts extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      model: new MockChartModel(),
    };
  }

  render() {
    const { model } = this.state;

    return (
      <div>
        <h2 className="ui-title">Chart</h2>
        <div style={{ height: 500 }}>
          <Chart model={model} settings={{}} />
        </div>
      </div>
    );
  }
}

export default Charts;
