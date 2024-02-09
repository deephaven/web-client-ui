import dh from '@deephaven/jsapi-shim';
import { Data } from 'plotly.js';
import ChartTestUtils from './ChartTestUtils';
import FigureChartModel from './FigureChartModel';

const chartTestUtils = new ChartTestUtils(dh);

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('populates the layout properly', () => {
  const figure = chartTestUtils.makeFigure();
  const model = new FigureChartModel(dh, figure);

  expect(model.getLayout()).toEqual(
    expect.objectContaining({
      title: expect.objectContaining({
        text: ChartTestUtils.DEFAULT_FIGURE_TITLE,
      }),
      annotations: expect.arrayContaining([
        expect.objectContaining({
          text: ChartTestUtils.DEFAULT_CHART_TITLE,
          xref: 'x1 domain',
          yref: 'y1 domain',
        }),
      ]),
    })
  );
});

it('populates series data properly', () => {
  const figure = chartTestUtils.makeFigure();
  const model = new FigureChartModel(dh, figure);

  expect(model.getData()).toEqual([
    expect.objectContaining({
      mode: 'markers',
      name: ChartTestUtils.DEFAULT_SERIES_NAME,
    }),
  ]);

  expect(model.getData()).not.toEqual([
    expect.objectContaining({
      orientation: 'h',
    }),
  ]);
});

it('populates horizontal series properly', () => {
  const axes = chartTestUtils.makeDefaultAxes();
  let sources = axes.map(axis => chartTestUtils.makeSource({ axis }));
  sources = [sources[1], sources[0]];
  const series = chartTestUtils.makeSeries({ sources });
  const chart = chartTestUtils.makeChart({ series: [series], axes });
  const figure = chartTestUtils.makeFigure({ charts: [chart] });

  const model = new FigureChartModel(dh, figure);

  expect(model.getData()).toEqual([
    expect.objectContaining({ orientation: 'h' }),
  ]);
});

it('converts histograms properly to bars', () => {
  const series = chartTestUtils.makeSeries({
    plotStyle: dh.plot.SeriesPlotStyle.HISTOGRAM,
  });
  const chart = chartTestUtils.makeChart({ series: [series] });
  const figure = chartTestUtils.makeFigure({ charts: [chart] });
  const model = new FigureChartModel(dh, figure);

  expect(model.getData()).toEqual([
    expect.objectContaining({
      name: ChartTestUtils.DEFAULT_SERIES_NAME,
      type: 'bar',
      width: [],
    }),
  ]);
});

it('handles colors on line charts properly', () => {
  const lineColor = '#123fff';
  const shapeColor = '#abc999';
  const series = chartTestUtils.makeSeries({
    plotStyle: dh.plot.SeriesPlotStyle.LINE,
    lineColor,
    shapeColor,
  });
  const chart = chartTestUtils.makeChart({ series: [series] });
  const figure = chartTestUtils.makeFigure({ charts: [chart] });
  const model = new FigureChartModel(dh, figure);

  expect(model.getData()).toEqual([
    expect.objectContaining({
      marker: expect.objectContaining({
        color: shapeColor,
      }),
      line: expect.objectContaining({
        color: lineColor,
      }),
    }),
  ]);
});

it('handles colors on bar charts properly', () => {
  const lineColor = '#badfad';
  const series = chartTestUtils.makeSeries({
    plotStyle: dh.plot.SeriesPlotStyle.BAR,
    lineColor,
  });
  const chart = chartTestUtils.makeChart({ series: [series] });
  const figure = chartTestUtils.makeFigure({ charts: [chart] });
  const model = new FigureChartModel(dh, figure);

  expect(model.getData()).toEqual([
    expect.objectContaining({
      marker: expect.objectContaining({
        color: lineColor,
      }),
    }),
  ]);
});

it('adds new series', () => {
  const series1 = chartTestUtils.makeSeries({ name: 'S1' });
  const chart = chartTestUtils.makeChart({ series: [series1] });
  const figure = chartTestUtils.makeFigure({
    charts: [chart],
  });
  const model = new FigureChartModel(dh, figure);
  model.subscribe(jest.fn());

  expect(model.getData()).toEqual([
    expect.objectContaining({
      mode: 'markers',
      name: 'S1',
    }),
  ]);

  const series2 = chartTestUtils.makeSeries({ name: 'S2' });
  chart.series = [...chart.series, series2];

  figure.fireEvent(dh.plot.Figure.EVENT_SERIES_ADDED, series2);

  jest.runOnlyPendingTimers();

  expect(model.getData()).toEqual([
    expect.objectContaining({
      mode: 'markers',
      name: 'S1',
    }),
    expect.objectContaining({
      mode: 'markers',
      name: 'S2',
    }),
  ]);
});

it('emits finished loading if no series are added', () => {
  const figure = chartTestUtils.makeFigure({
    charts: [],
  });
  const model = new FigureChartModel(dh, figure);
  const callback = jest.fn();
  model.subscribe(callback);

  jest.runOnlyPendingTimers();

  expect(callback).toHaveBeenCalledWith(
    expect.objectContaining({
      type: FigureChartModel.EVENT_LOADFINISHED,
    })
  );
});

describe('legend visibility', () => {
  function testLegend(showLegend: boolean | null): Partial<Data>[] {
    const series1 = chartTestUtils.makeSeries({ name: 'S1' });
    const chart = chartTestUtils.makeChart({ series: [series1], showLegend });
    const figure = chartTestUtils.makeFigure({
      charts: [chart],
    });
    const model = new FigureChartModel(dh, figure);
    model.subscribe(jest.fn());

    return model.getData();
  }

  it('shows legend when set to true', () => {
    expect(testLegend(true)).toEqual([
      expect.objectContaining({
        showlegend: true,
      }),
    ]);
  });

  it('hides legend when set to false', () => {
    expect(testLegend(false)).toEqual([
      expect.objectContaining({
        showlegend: false,
      }),
    ]);
  });

  it('does not set property when not provided', () => {
    expect(testLegend(null)).toEqual([
      expect.objectContaining({ showlegend: undefined }),
    ]);
  });
});
