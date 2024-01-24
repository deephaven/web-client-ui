import type {
  dh.plot.Axis,
  dh.plot.AxisFormatType,
  dh.plot.AxisPosition,
  dh.plot.AxisType,
  dh.plot.Chart,
  dh as DhType,
  dh.plot.Figure,
  dh.plot.Series,
  dh.plot.SeriesDataSource,
} from '@deephaven/jsapi-types';

class ChartTestUtils {
  static DEFAULT_FIGURE_TITLE = 'Figure Title';

  static DEFAULT_CHART_TITLE = 'Chart Title';

  static DEFAULT_X_TITLE = 'X Axis';

  static DEFAULT_Y_TITLE = 'Y Axis';

  static DEFAULT_SERIES_NAME = 'MySeries';

  private dh: DhType;

  constructor(dh: DhType) {
    this.dh = dh;
  }

  makeAxis({
    label = 'Axis',
    type = undefined,
    position = undefined,
    formatType = undefined,
    formatPattern = '###,###0.00',
    log = false,
  }: {
    label?: string;
    type?: dh.plot.AxisType;
    position?: dh.plot.AxisPosition;
    formatType?: dh.plot.AxisFormatType;
    formatPattern?: string;
    log?: boolean;
  } = {}): dh.plot.Axis {
    const { dh } = this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).Axis({
      label,
      type: type ?? dh.plot.AxisType.X,
      position: position ?? dh.plot.AxisPosition.BOTTOM,
      formatType: formatType ?? dh.Axis.FORMAT_TYPE_NUMBER,
      formatPattern,
      log,
    });
  }

  makeDefaultAxes(): dh.plot.Axis[] {
    const { dh } = this;
    return [
      this.makeAxis({
        label: ChartTestUtils.DEFAULT_X_TITLE,
        type: dh.plot.AxisType.X,
      }),
      this.makeAxis({
        label: ChartTestUtils.DEFAULT_Y_TITLE,
        type: dh.plot.AxisType.Y,
      }),
    ];
  }

  makeSource({ axis = this.makeAxis() }: { axis: dh.plot.Axis }): dh.plot.SeriesDataSource {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).SeriesDataSource({ axis, type: axis.type });
  }

  makeDefaultSources(): dh.plot.SeriesDataSource[] {
    const axes = this.makeDefaultAxes();
    return axes.map(axis => this.makeSource({ axis }));
  }

  makeSeries({
    name = ChartTestUtils.DEFAULT_SERIES_NAME,
    plotStyle = null,
    sources = this.makeDefaultSources(),
    lineColor = null,
    shapeColor = null,
  } = {}): dh.plot.Series {
    const { dh } = this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).Series(
      name,
      plotStyle ?? dh.plot.SeriesPlotStyle.SCATTER,
      sources,
      lineColor,
      shapeColor
    );
  }

  makeChart({
    title = ChartTestUtils.DEFAULT_CHART_TITLE,
    series = [this.makeSeries()],
    axes = this.makeDefaultAxes(),
    showLegend = null,
    rowspan = 1,
    colspan = 1,
    row = 0,
    column = 0,
  }: {
    title?: string;
    series?: dh.plot.Series[];
    axes?: dh.plot.Axis[];
    showLegend?: boolean | null;
    rowspan?: number;
    colspan?: number;
    row?: number;
    column?: number;
  } = {}): dh.plot.Chart {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).Chart({
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

  makeFigure({
    title = ChartTestUtils.DEFAULT_FIGURE_TITLE,
    charts = [this.makeChart()],
    rows = 1,
    cols = 1,
    errors = [],
  } = {}): dh.plot.Figure {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).plot.Figure({
      title,
      charts,
      rows,
      cols,
      errors,
    });
  }
}

export default ChartTestUtils;
