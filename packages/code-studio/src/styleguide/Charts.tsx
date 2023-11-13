/* eslint-disable react/jsx-props-no-spreading */
import React, { ReactElement, useState } from 'react';
import { Chart, ChartModel, MockChartModel } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { sampleSectionIdAndClasses } from './utils';

function Charts(): ReactElement {
  const dh = useApi();
  const [model] = useState(() => new MockChartModel(dh));

  return (
    <div {...sampleSectionIdAndClasses('charts')}>
      <h2 className="ui-title">Chart</h2>
      <div style={{ height: 500 }}>
        <Chart model={model as ChartModel} />
      </div>
    </div>
  );
}

export default Charts;
