import type { dh as DhType } from '@deephaven/jsapi-types';

class ChartTestUtils {
  static DEFAULT_FIGURE_TITLE = 'Figure Title';

  static DEFAULT_CHART_TITLE = 'Chart Title';

  static DEFAULT_X_TITLE = 'X Axis';

  static DEFAULT_Y_TITLE = 'Y Axis';

  static DEFAULT_SERIES_NAME = 'MySeries';

  private dh: typeof DhType;

  constructor(dh: typeof DhType) {
    this.dh = dh;
  }

  makeAxis({
    label = 'Axis',
    type = undefined,
    position = undefined,
    formatType = undefined,
    formatPattern = '###,###0.00',
    log = false,
    minRange = undefined,
    maxRange = undefined,
  }: {
    label?: string;
    type?: DhType.plot.AxisType;
    position?: DhType.plot.AxisPosition;
    formatType?: DhType.plot.AxisFormatType;
    formatPattern?: string;
    log?: boolean;
    minRange?: number;
    maxRange?: number;
  } = {}): DhType.plot.Axis {
    const { dh } = this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (dh as any).Axis({
      label,
      type: type ?? dh.plot.AxisType.X,
      position: position ?? dh.plot.AxisPosition.BOTTOM,
      formatType: formatType ?? dh.plot.AxisFormatType.NUMBER,
      formatPattern,
      log,
      minRange,
      maxRange,
    });
  }

  makeDefaultAxes(): DhType.plot.Axis[] {
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

  makeSource({
    axis = this.makeAxis(),
  }: {
    axis: DhType.plot.Axis;
  }): DhType.plot.SeriesDataSource {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).SeriesDataSource({ axis, type: axis.type });
  }

  makeDefaultSources(): DhType.plot.SeriesDataSource[] {
    const axes = this.makeDefaultAxes();
    return axes.map(axis => this.makeSource({ axis }));
  }

  makeSeries({
    name = ChartTestUtils.DEFAULT_SERIES_NAME,
    plotStyle = null,
    sources = this.makeDefaultSources(),
    lineColor = null,
    shapeColor = null,
  }: {
    name?: string | null;
    lineColor?: string | null;
    plotStyle?: DhType.plot.SeriesPlotStyleType | null;
    shapeColor?: string | null;
    sources?: DhType.plot.SeriesDataSource[];
  } = {}): DhType.plot.Series {
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
    series?: DhType.plot.Series[];
    axes?: DhType.plot.Axis[];
    showLegend?: boolean | null;
    rowspan?: number;
    colspan?: number;
    row?: number;
    column?: number;
  } = {}): DhType.plot.Chart {
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
  } = {}): DhType.plot.Figure {
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
