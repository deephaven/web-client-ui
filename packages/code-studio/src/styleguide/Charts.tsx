import React, { ReactElement, useState } from 'react';
import { Chart, ChartModel, MockChartModel } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';

function Charts(): ReactElement {
  const dh = useApi();
  const [model] = useState(new MockChartModel(dh));

  return (
    <div>
      <h2 className="ui-title">Chart</h2>
      <div style={{ height: 500 }}>
        <Chart model={model as ChartModel} />
      </div>
    </div>
  );
}

export default Charts;
