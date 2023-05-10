import type {
  AxisFormatType,
  AxisPosition,
  AxisType,
  dh as DhType,
} from '@deephaven/jsapi-types';
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
    type?: AxisType;
    position?: AxisPosition;
    formatType?: AxisFormatType;
    formatPattern?: string;
    log?: boolean;
  } = {}): Axis {
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

  makeDefaultAxes(): Axis[] {
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

  makeSource({ axis = this.makeAxis() }: { axis: Axis }): SeriesDataSource {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).SeriesDataSource({ axis, type: axis.type });
  }

  makeDefaultSources(): SeriesDataSource[] {
    const axes = this.makeDefaultAxes();
    return axes.map(axis => this.makeSource({ axis }));
  }

  makeSeries({
    name = ChartTestUtils.DEFAULT_SERIES_NAME,
    plotStyle = null,
    sources = this.makeDefaultSources(),
    lineColor = null,
    shapeColor = null,
  } = {}): Series {
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
    series?: Series[];
    axes?: Axis[];
    showLegend?: boolean | null;
    rowspan?: number;
    colspan?: number;
    row?: number;
    column?: number;
  } = {}): Chart {
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
    title = 'Figure',
    charts = [this.makeChart()],
    rows = 1,
    cols = 1,
  } = {}): Figure {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (this.dh as any).plot.Figure({ title, charts, rows, cols });
  }
}

export default ChartTestUtils;
