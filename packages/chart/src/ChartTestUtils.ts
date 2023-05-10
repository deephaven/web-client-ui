import dh from '@deephaven/jsapi-shim';
import type {
  Axis,
  Chart,
  Figure,
  Series,
  SeriesDataSource,
} from '@deephaven/jsapi-types';

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
  } = {}): Axis {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).Axis({
      label,
      type,
      position,
      formatType,
      formatPattern,
      log,
    });
  }

  static makeDefaultAxes(): Axis[] {
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

  static makeSource({
    axis = ChartTestUtils.makeAxis(),
  }: {
    axis: Axis;
  }): SeriesDataSource {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).SeriesDataSource({ axis, type: axis.type });
  }

  static makeDefaultSources(): SeriesDataSource[] {
    const axes = ChartTestUtils.makeDefaultAxes();
    return axes.map(axis => ChartTestUtils.makeSource({ axis }));
  }

  static makeSeries({
    name = ChartTestUtils.DEFAULT_SERIES_NAME,
    plotStyle = dh.plot.SeriesPlotStyle.SCATTER,
    sources = ChartTestUtils.makeDefaultSources(),
    lineColor = null,
    shapeColor = null,
  } = {}): Series {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).Series(
      name,
      plotStyle,
      sources,
      lineColor,
      shapeColor
    );
  }

  static makeChart({
    title = ChartTestUtils.DEFAULT_CHART_TITLE,
    series = [ChartTestUtils.makeSeries()],
    axes = ChartTestUtils.makeDefaultAxes(),
    showLegend = null,
    rowspan = 1,
    colspan = 1,
    row = 0,
    column = 0,
  }: {
    title?: string;
    series?: Series[];
    axes?: Axis[];
    showLegend?: boolean | null;
    rowspan?: number;
    colspan?: number;
    row?: number;
    column?: number;
  } = {}): Chart {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).Chart({
      title,
      series,
      axes,
      showLegend,
      row,
      column,
      rowspan,
      colspan,
    });
  }

  static makeFigure({
    title = 'Figure',
    charts = [ChartTestUtils.makeChart()],
    rows = 1,
    cols = 1,
  } = {}): Figure {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).plot.Figure({ title, charts, rows, cols });
  }
}

export default ChartTestUtils;
