import dh from '@deephaven/jsapi-shim';
import ChartTestUtils from './ChartTestUtils';
import FigureChartModel from './FigureChartModel';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('populates the layout properly', () => {
  const figure = ChartTestUtils.makeFigure();
  const model = new FigureChartModel(figure);

  expect(model.getLayout()).toEqual(
    expect.objectContaining({
      title: expect.objectContaining({
        text: ChartTestUtils.DEFAULT_CHART_TITLE,
      }),
      xaxis: expect.objectContaining({
        title: expect.objectContaining({
          text: ChartTestUtils.DEFAULT_X_TITLE,
        }),
      }),
      yaxis: expect.objectContaining({
        title: expect.objectContaining({
          text: ChartTestUtils.DEFAULT_Y_TITLE,
        }),
      }),
    })
  );
});

it('populates series data properly', () => {
  const figure = ChartTestUtils.makeFigure();
  const model = new FigureChartModel(figure);

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
  const axes = ChartTestUtils.makeDefaultAxes();
  let sources = axes.map(axis => ChartTestUtils.makeSource({ axis }));
  sources = [sources[1], sources[0]];
  const series = ChartTestUtils.makeSeries({ sources });
  const chart = ChartTestUtils.makeChart({ series: [series], axes });
  const figure = ChartTestUtils.makeFigure({ charts: [chart] });

  const model = new FigureChartModel(figure);

  expect(model.getData()).toEqual([
    expect.objectContaining({ orientation: 'h' }),
  ]);
});

it('converts histograms properly to bars', () => {
  const series = ChartTestUtils.makeSeries({
    plotStyle: dh.plot.SeriesPlotStyle.HISTOGRAM,
  });
  const chart = ChartTestUtils.makeChart({ series: [series] });
  const figure = ChartTestUtils.makeFigure({ charts: [chart] });
  const model = new FigureChartModel(figure);

  expect(model.getData()).toEqual([
    expect.objectContaining({
      name: ChartTestUtils.DEFAULT_SERIES_NAME,
      type: 'bar',
      marker: expect.objectContaining({
        line: expect.objectContaining({
          width: 1,
        }),
      }),
    }),
  ]);
});

it('handles colors on line charts properly', () => {
  const lineColor = '#123fff';
  const shapeColor = '#abc999';
  const series = ChartTestUtils.makeSeries({
    plotStyle: dh.plot.SeriesPlotStyle.LINE,
    lineColor,
    shapeColor,
  });
  const chart = ChartTestUtils.makeChart({ series: [series] });
  const figure = ChartTestUtils.makeFigure({ charts: [chart] });
  const model = new FigureChartModel(figure);

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
  const series = ChartTestUtils.makeSeries({
    plotStyle: dh.plot.SeriesPlotStyle.BAR,
    lineColor,
  });
  const chart = ChartTestUtils.makeChart({ series: [series] });
  const figure = ChartTestUtils.makeFigure({ charts: [chart] });
  const model = new FigureChartModel(figure);

  expect(model.getData()).toEqual([
    expect.objectContaining({
      marker: expect.objectContaining({
        color: lineColor,
      }),
    }),
  ]);
});

describe('axis transform tests', () => {
  it('handles log x-axis properly', () => {
    const xAxis = ChartTestUtils.makeAxis({
      label: ChartTestUtils.DEFAULT_X_TITLE,
      type: dh.plot.AxisType.X,
      log: true,
    });
    const yAxis = ChartTestUtils.makeAxis({
      label: ChartTestUtils.DEFAULT_Y_TITLE,
      type: dh.plot.AxisType.Y,
    });
    const axes = [xAxis, yAxis];
    const sources = axes.map(axis => ChartTestUtils.makeSource({ axis }));
    const series = ChartTestUtils.makeSeries({ sources });
    const chart = ChartTestUtils.makeChart({ series: [series], axes });
    const figure = ChartTestUtils.makeFigure({ charts: [chart] });
    const model = new FigureChartModel(figure);

    expect(model.getLayout().xaxis).toMatchObject({
      type: 'log',
    });
    expect(model.getLayout().yaxis).not.toMatchObject({
      type: 'log',
    });
  });

  it('handles log y-axis properly', () => {
    const xAxis = ChartTestUtils.makeAxis({
      label: ChartTestUtils.DEFAULT_X_TITLE,
      type: dh.plot.AxisType.X,
    });
    const yAxis = ChartTestUtils.makeAxis({
      label: ChartTestUtils.DEFAULT_Y_TITLE,
      type: dh.plot.AxisType.Y,
      log: true,
    });
    const axes = [xAxis, yAxis];
    const sources = axes.map(axis => ChartTestUtils.makeSource({ axis }));
    const series = ChartTestUtils.makeSeries({ sources });
    const chart = ChartTestUtils.makeChart({ series: [series], axes });
    const figure = ChartTestUtils.makeFigure({ charts: [chart] });
    const model = new FigureChartModel(figure);

    expect(model.getLayout().xaxis).not.toMatchObject({
      type: 'log',
    });
    expect(model.getLayout().yaxis).toMatchObject({
      type: 'log',
    });
  });
});

describe('multiple axes', () => {
  it('handles two y-axes properly', () => {
    const xaxis = ChartTestUtils.makeAxis({
      label: 'x1',
      type: dh.plot.AxisType.X,
      position: dh.plot.AxisPosition.BOTTOM,
    });

    const yaxis1 = ChartTestUtils.makeAxis({
      label: 'y1',
      type: dh.plot.AxisType.Y,
      position: dh.plot.AxisPosition.LEFT,
    });

    const yaxis2 = ChartTestUtils.makeAxis({
      label: 'y2',
      type: dh.plot.AxisType.Y,
      position: dh.plot.AxisPosition.RIGHT,
    });
    const axes = [xaxis, yaxis1, yaxis2];

    const chart = ChartTestUtils.makeChart({ axes });
    const figure = ChartTestUtils.makeFigure({ charts: [chart] });
    const model = new FigureChartModel(figure);

    const layout = model.getLayout();

    expect(layout.xaxis).toEqual(
      expect.objectContaining({
        side: 'bottom',
        title: expect.objectContaining({ text: 'x1' }),
      })
    );

    expect(layout.yaxis).toEqual(
      expect.objectContaining({
        side: 'left',
        title: expect.objectContaining({ text: 'y1' }),
      })
    );

    expect(layout.yaxis2).toEqual(
      expect.objectContaining({
        side: 'right',
        title: expect.objectContaining({ text: 'y2' }),
        overlaying: 'y',
      })
    );
  });

  it('handles multiple y-axes on the same side properly', () => {
    const xaxis = ChartTestUtils.makeAxis({
      label: 'x1',
      type: dh.plot.AxisType.X,
      position: dh.plot.AxisPosition.BOTTOM,
    });

    const yaxis1 = ChartTestUtils.makeAxis({
      label: 'y1',
      type: dh.plot.AxisType.Y,
      position: dh.plot.AxisPosition.RIGHT,
    });

    const yaxis2 = ChartTestUtils.makeAxis({
      label: 'y2',
      type: dh.plot.AxisType.Y,
      position: dh.plot.AxisPosition.RIGHT,
    });

    const yaxis3 = ChartTestUtils.makeAxis({
      label: 'y3',
      type: dh.plot.AxisType.Y,
      position: dh.plot.AxisPosition.RIGHT,
    });

    const axes = [xaxis, yaxis1, yaxis2, yaxis3];

    const chart = ChartTestUtils.makeChart({ axes });
    const figure = ChartTestUtils.makeFigure({ charts: [chart] });
    const model = new FigureChartModel(figure);

    const layout = model.getLayout();

    expect(layout.xaxis).toEqual(
      expect.objectContaining({
        side: 'bottom',
        title: expect.objectContaining({ text: 'x1' }),
        domain: [0, 0.55],
      })
    );

    expect(layout.yaxis).toEqual(
      expect.objectContaining({
        side: 'right',
        title: expect.objectContaining({ text: 'y1' }),
      })
    );

    expect(layout.yaxis2).toEqual(
      expect.objectContaining({
        side: 'right',
        title: expect.objectContaining({ text: 'y2' }),
        overlaying: 'y',
        position: 0.7,
        anchor: 'free',
      })
    );

    expect(layout.yaxis3).toEqual(
      expect.objectContaining({
        side: 'right',
        title: expect.objectContaining({ text: 'y3' }),
        overlaying: 'y',
        position: 0.85,
        anchor: 'free',
      })
    );
  });

  it('handles two x-axes properly', () => {
    const xaxis1 = ChartTestUtils.makeAxis({
      label: 'x1',
      type: dh.plot.AxisType.X,
      position: dh.plot.AxisPosition.BOTTOM,
    });

    const xaxis2 = ChartTestUtils.makeAxis({
      label: 'x2',
      type: dh.plot.AxisType.X,
      position: dh.plot.AxisPosition.TOP,
    });

    const yaxis = ChartTestUtils.makeAxis({
      label: 'y1',
      type: dh.plot.AxisType.Y,
      position: dh.plot.AxisPosition.LEFT,
    });
    const axes = [xaxis1, xaxis2, yaxis];

    const chart = ChartTestUtils.makeChart({ axes });
    const figure = ChartTestUtils.makeFigure({ charts: [chart] });
    const model = new FigureChartModel(figure);

    const layout = model.getLayout();

    expect(layout.xaxis).toEqual(
      expect.objectContaining({
        side: 'bottom',
        title: expect.objectContaining({ text: 'x1' }),
      })
    );

    expect(layout.xaxis2).toEqual(
      expect.objectContaining({
        side: 'top',
        title: expect.objectContaining({ text: 'x2' }),
        overlaying: 'x',
      })
    );

    expect(layout.yaxis).toEqual(
      expect.objectContaining({
        side: 'left',
        title: expect.objectContaining({ text: 'y1' }),
      })
    );
  });

  it('handles multiple x-axes on the same side properly', () => {
    const xaxis = ChartTestUtils.makeAxis({
      label: 'x1',
      type: dh.plot.AxisType.X,
      position: dh.plot.AxisPosition.TOP,
    });

    const xaxis2 = ChartTestUtils.makeAxis({
      label: 'x2',
      type: dh.plot.AxisType.X,
      position: dh.plot.AxisPosition.TOP,
    });

    const xaxis3 = ChartTestUtils.makeAxis({
      label: 'x3',
      type: dh.plot.AxisType.X,
      position: dh.plot.AxisPosition.TOP,
    });

    const yaxis = ChartTestUtils.makeAxis({
      label: 'y1',
      type: dh.plot.AxisType.Y,
      position: dh.plot.AxisPosition.LEFT,
    });

    const axes = [xaxis, xaxis2, xaxis3, yaxis];

    const chart = ChartTestUtils.makeChart({ axes });
    const figure = ChartTestUtils.makeFigure({ charts: [chart] });
    const model = new FigureChartModel(figure);

    const layout = model.getLayout();

    expect(layout.xaxis).toEqual(
      expect.objectContaining({
        side: 'top',
        title: expect.objectContaining({ text: 'x1' }),
      })
    );

    expect(layout.xaxis2).toEqual(
      expect.objectContaining({
        side: 'top',
        title: expect.objectContaining({ text: 'x2' }),
        overlaying: 'x',
        position: 0.85,
        anchor: 'free',
      })
    );

    expect(layout.xaxis3).toEqual(
      expect.objectContaining({
        side: 'top',
        title: expect.objectContaining({ text: 'x3' }),
        overlaying: 'x',
        position: 1,
        anchor: 'free',
      })
    );

    expect(layout.yaxis).toEqual(
      expect.objectContaining({
        side: 'left',
        title: expect.objectContaining({ text: 'y1' }),
        domain: [0, 0.7],
      })
    );
  });
});

it('adds new series', () => {
  const series1 = ChartTestUtils.makeSeries({ name: 'S1' });
  const chart = ChartTestUtils.makeChart({ series: [series1] });
  const figure = ChartTestUtils.makeFigure({
    charts: [chart],
  });
  const model = new FigureChartModel(figure);
  model.subscribe(jest.fn(), jest.fn());

  expect(model.getData()).toEqual([
    expect.objectContaining({
      mode: 'markers',
      name: 'S1',
    }),
  ]);

  const series2 = ChartTestUtils.makeSeries({ name: 'S2' });
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
