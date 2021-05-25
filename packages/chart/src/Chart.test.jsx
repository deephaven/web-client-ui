import React from 'react';
import TestRenderer from 'react-test-renderer';
import dh from '@deephaven/jsapi-shim';
import { Chart } from './Chart';
import TableChartModel from './TableChartModel';

jest.mock('./plotly/Plot');
jest.mock('./plotly/Plotly');

const COLUMN_NAMES = ['A', 'B', 'C'];

function makeMockDiv() {
  return {
    getBoundingClientRect: jest.fn(() => ({
      top: 0,
      left: 0,
      width: 500,
      height: 500,
    })),
  };
}

function createNodeMock(element) {
  if (element.type === 'div') {
    return makeMockDiv();
  }

  return null;
}

function makeChartSettings({
  xAxis = 'A',
  series = ['B'],
  type = dh.plot.SeriesPlotStyle.SCATTER,
} = {}) {
  return { xAxis, series, type };
}

function makeTable({ columnNames = COLUMN_NAMES, size = 100 } = {}) {
  const type = 'test';
  const columns = columnNames.map(name => new dh.Column({ name, type }));

  return new dh.Table({ columns, size });
}

function makeChart({
  chartSettings = makeChartSettings(),
  table = makeTable(),
  settings = {},
} = {}) {
  const model = new TableChartModel(chartSettings, table);
  return TestRenderer.create(<Chart model={model} settings={settings} />, {
    createNodeMock,
  });
}

beforeEach(() => {
  jest.useFakeTimers();
});

it('renders without crashing', () => {
  const wrapper = makeChart();

  wrapper.unmount();
});

describe('different chart types build properly', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  async function testPlotStyle(plotStyle, expectedData = {}) {
    const chartSettings = makeChartSettings({ type: plotStyle });
    const table = makeTable({ size: 3 });
    const wrapper = await makeChart({ chartSettings, table });

    jest.runOnlyPendingTimers();
    expect(wrapper.getInstance().state.data).toEqual([
      expect.objectContaining({
        x: ['A0', 'A1', 'A2'],
        y: ['B0', 'B1', 'B2'],
      }),
    ]);
    expect(wrapper.getInstance().state.data).toEqual([
      expect.objectContaining(expectedData),
    ]);

    wrapper.unmount();
  }

  it('does scatter properly', async () => {
    await testPlotStyle(dh.plot.SeriesPlotStyle.SCATTER, {
      type: 'scattergl',
      mode: 'markers',
    });
  });

  it('does line properly with scatter instead of scattergl', async () => {
    await testPlotStyle(dh.plot.SeriesPlotStyle.LINE, {
      type: 'scatter',
      mode: 'lines',
    });
  });

  it('does bar properly', async () => {
    await testPlotStyle(dh.plot.SeriesPlotStyle.BAR, {
      type: 'bar',
    });
  });
});
