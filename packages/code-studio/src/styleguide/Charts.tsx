import React, { PureComponent } from 'react';
import { Chart, MockChartModel } from '@deephaven/chart';

interface ChartsState {
  model: MockChartModel;
}
class Charts extends PureComponent<Record<string, never>, ChartsState> {
  constructor(props: Record<string, never>) {
    super(props);

    this.state = {
      model: new MockChartModel(),
    };
  }

  render(): React.ReactElement {
    const { model } = this.state;

    return (
      <div>
        <h2 className="ui-title">Chart</h2>
        <div style={{ height: 500 }}>
          <Chart model={model} />
        </div>
      </div>
    );
  }
}

export default Charts;
