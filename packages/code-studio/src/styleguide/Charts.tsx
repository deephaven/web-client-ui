import React, { type ReactElement, useState } from 'react';
import { Chart, type ChartModel, MockChartModel } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useSeededRandomNumberCallback } from './utils';
import SampleSection from './SampleSection';

function Charts(): ReactElement {
  const dh = useApi();

  MockChartModel.random = useSeededRandomNumberCallback();

  const [model] = useState(() => new MockChartModel(dh));

  return (
    <SampleSection name="charts">
      <h2 className="ui-title">Chart</h2>
      <div style={{ height: 500 }}>
        <Chart model={model as ChartModel} />
      </div>
    </SampleSection>
  );
}

export default Charts;
