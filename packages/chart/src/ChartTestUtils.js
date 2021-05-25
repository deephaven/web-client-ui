import dh from '@deephaven/jsapi-shim';

class ChartTestUtils {
  static DEFAULT_CHART_TITLE = 'Chart Title';

  static DEFAULT_X_TITLE = 'X Axis';

  static DEFAULT_Y_TITLE = 'Y Axis';

  static DEFAULT_SERIES_NAME = 'MySeries';

  static makeAxis({
    label = 'Axis',
    type = dh.plot.AxisType.X,
    position = dh.plot.AxisPosition.BOTTOM,
    formatType = dh.Axis.FORMAT_TYPE_NUMBER,
    formatPattern = '###,###0.00',
    log = false,
  } = {}) {
    return new dh.Axis({
      label,
      type,
      position,
      formatType,
      formatPattern,
      log,
    });
  }

  static makeDefaultAxes() {
    return [
      ChartTestUtils.makeAxis({
        label: ChartTestUtils.DEFAULT_X_TITLE,
        type: dh.plot.AxisType.X,
      }),
      ChartTestUtils.makeAxis({
        label: ChartTestUtils.DEFAULT_Y_TITLE,
        type: dh.plot.AxisType.Y,
      }),
    ];
  }

  static makeSource({ axis = ChartTestUtils.makeAxis() }) {
    return new dh.SeriesDataSource({ axis, type: axis.type });
  }

  static makeDefaultSources() {
    const axes = ChartTestUtils.makeDefaultAxes();
    return axes.map(axis => ChartTestUtils.makeSource({ axis }));
  }

  static makeSeries({
    name = ChartTestUtils.DEFAULT_SERIES_NAME,
    plotStyle = dh.plot.SeriesPlotStyle.SCATTER,
    sources = ChartTestUtils.makeDefaultSources(),
    lineColor = null,
    shapeColor = null,
  } = {}) {
    return new dh.Series(name, plotStyle, sources, lineColor, shapeColor);
  }

  static makeChart({
    title = ChartTestUtils.DEFAULT_CHART_TITLE,
    series = [ChartTestUtils.makeSeries()],
    axes = ChartTestUtils.makeDefaultAxes(),
  } = {}) {
    return new dh.Chart({ title, series, axes });
  }

  static makeFigure({
    title = 'Figure',
    charts = [ChartTestUtils.makeChart()],
  } = {}) {
    return new dh.plot.Figure({ title, charts });
  }
}

export default ChartTestUtils;
