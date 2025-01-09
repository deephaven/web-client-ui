/* eslint class-methods-use-this: "off" */
import memoize from 'memoizee';
import debounce from 'lodash.debounce';
import set from 'lodash.set';
import type { dh as DhType } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { type Range } from '@deephaven/utils';
import type {
  Annotations,
  Layout,
  Data,
  PlotData,
  XAxisName,
  YAxisName,
} from 'plotly.js';
import type {
  DateTimeColumnFormatter,
  Formatter,
} from '@deephaven/jsapi-utils';
import ChartModel, {
  type ChartEvent,
  type FigureUpdateEventData,
  type RenderOptions,
} from './ChartModel';
import ChartUtils, {
  type AxisTypeMap,
  type ChartModelSettings,
  type FilterColumnMap,
  type FilterMap,
} from './ChartUtils';

const log = Log.module('FigureChartModel');

/**
 * Takes a Figure object from a widget to make a model for a chart
 */
class FigureChartModel extends ChartModel {
  static ADD_SERIES_DEBOUNCE = 50;

  /**
   * @param dh JSAPI instance
   * @param figure The figure object created by the API
   * @param settings Chart settings
   */
  constructor(
    dh: typeof DhType,
    figure: DhType.plot.Figure,
    settings: Partial<ChartModelSettings> = {}
  ) {
    super(dh);

    this.handleFigureUpdated = this.handleFigureUpdated.bind(this);
    this.handleFigureDisconnected = this.handleFigureDisconnected.bind(this);
    this.handleFigureReconnected = this.handleFigureReconnected.bind(this);
    this.handleFigureSeriesAdded = this.handleFigureSeriesAdded.bind(this);
    this.handleDownsampleStart = this.handleDownsampleStart.bind(this);
    this.handleDownsampleFinish = this.handleDownsampleFinish.bind(this);
    this.handleDownsampleFail = this.handleDownsampleFail.bind(this);
    this.handleDownsampleNeeded = this.handleDownsampleNeeded.bind(this);
    this.handleRequestFailed = this.handleRequestFailed.bind(this);

    this.dh = dh;
    this.chartUtils = new ChartUtils(dh);
    this.figure = figure;
    this.settings = settings;
    this.data = [];
    this.layout = {
      grid: {
        rows: figure.rows,
        columns: figure.cols,
        pattern: 'independent',
      },
    };
    this.seriesDataMap = new Map();
    this.pendingSeries = [];
    this.oneClicks = [];
    this.filterColumnMap = new Map();
    this.lastFilter = new Map();
    this.isConnected = true; // Assume figure is connected to start
    this.seriesToProcess = new Set();

    this.setTitle(this.getDefaultTitle());
    this.initAllSeries();
    this.updateAxisPositions();
    this.startListeningFigure();
  }

  chartUtils: ChartUtils;

  dh: typeof DhType;

  figure: DhType.plot.Figure;

  settings: Partial<ChartModelSettings>;

  data: Partial<Data>[];

  layout: Partial<Layout>;

  seriesDataMap: Map<
    string,
    Partial<PlotData> & {
      xLow?: number[];
      xHigh?: number[];
      yLow?: number[];
      yHigh?: number[];
    }
  >;

  pendingSeries: DhType.plot.Series[];

  oneClicks: DhType.plot.OneClick[];

  filterColumnMap: FilterColumnMap;

  lastFilter: FilterMap;

  isConnected: boolean; // Assume figure is connected to start

  seriesToProcess;

  close(): void {
    this.figure.close();
    this.addPendingSeries.cancel();
    this.stopListeningFigure();
  }

  getDefaultTitle(): string {
    if (this.figure.title != null && this.figure.title.length > 0) {
      return this.figure.title;
    }
    if (this.figure.charts.length === 1) {
      return this.figure.charts[0].title ?? '';
    }
    return '';
  }

  initAllSeries(): void {
    this.oneClicks = [];
    this.filterColumnMap.clear();

    const { charts } = this.figure;
    const axisTypeMap = ChartUtils.getAxisTypeMap(this.figure);
    const activeSeriesNames: string[] = [];

    this.seriesToProcess = new Set();

    for (let i = 0; i < charts.length; i += 1) {
      const chart = charts[i];

      for (let j = 0; j < chart.series.length; j += 1) {
        const series = chart.series[j];
        activeSeriesNames.push(series.name);
        this.addSeries(series, axisTypeMap, chart.showLegend);
      }

      // Need to add the chart titles as annotations if they are set
      const { axes, title } = chart;
      if (
        title != null &&
        title.length > 0 &&
        (charts.length > 1 || this.figure.title != null)
      ) {
        const xAxis = axes.find(axis => axis.type === this.dh.plot.AxisType.X);
        const yAxis = axes.find(axis => axis.type === this.dh.plot.AxisType.Y);
        if (xAxis == null || yAxis == null) {
          log.warn(
            'Chart title provided, but unknown how to map to the correct axes for this chart type',
            chart
          );
        } else {
          const xAxisIndex =
            (axisTypeMap.get(xAxis.type)?.findIndex(a => a === xAxis) ?? 0) + 1;
          const yAxisIndex =
            (axisTypeMap.get(yAxis.type)?.findIndex(a => a === yAxis) ?? 0) + 1;

          const annotation: Partial<Annotations> = {
            align: 'center',
            x: 0.5,
            y: 1,
            yshift: 17,
            text: title,
            showarrow: false,

            // Typing is incorrect in Plotly for this, as it doesn't seem to be typed for the "domain" part: https://plotly.com/javascript/reference/layout/annotations/#layout-annotations-items-annotation-xref
            xref: `x${xAxisIndex} domain` as XAxisName,
            yref: `y${yAxisIndex} domain` as YAxisName,
          };
          if (this.layout.annotations == null) {
            this.layout.annotations = [annotation];
          } else {
            this.layout.annotations.push(annotation);
          }
        }
      }
    }

    // Remove any series that no longer exist
    const allSeriesNames = [...this.seriesDataMap.keys()];
    const inactiveSeriesNames = allSeriesNames.filter(
      seriesName => activeSeriesNames.indexOf(seriesName) < 0
    );
    for (let i = 0; i < inactiveSeriesNames.length; i += 1) {
      const seriesName = inactiveSeriesNames[i];
      this.seriesDataMap.delete(seriesName);
    }
  }

  /**
   * Add a series to the model
   * @param series Series object to add
   * @param axisTypeMap Map of axis type to the axes in this Figure
   * @param showLegend Whether this series should show the legend or not
   */
  addSeries(
    series: DhType.plot.Series,
    axisTypeMap: AxisTypeMap,
    showLegend: boolean | null
  ): void {
    const { dh } = this;

    const seriesData = this.chartUtils.makeSeriesDataFromSeries(
      series,
      axisTypeMap,
      ChartUtils.getSeriesVisibility(series.name, this.settings),
      showLegend,
      this.renderOptions?.webgl ?? true
    );

    this.seriesDataMap.set(series.name, seriesData);
    this.seriesToProcess.add(series.name);

    this.data = [...this.seriesDataMap.values()];

    if (series.plotStyle === dh.plot.SeriesPlotStyle.STACKED_BAR) {
      this.layout.barmode = 'stack';
    } else if (series.plotStyle === dh.plot.SeriesPlotStyle.PIE) {
      this.layout.hiddenlabels = ChartUtils.getHiddenLabels(this.settings);
    }

    // We only want to force hide the legend if there is only one series that is not a PIE
    // Right now this means that if the user only has one series, they cannot explicitly show the legend until deephaven-core#3254 is implemented
    // TODO: deephaven-core#3254, once done, this can be removed.
    this.layout.showlegend =
      this.data.length > 1 || series.plotStyle === dh.plot.SeriesPlotStyle.PIE
        ? showLegend ?? undefined
        : false;

    if (series.oneClick != null) {
      const { oneClick } = series;
      const { columns } = oneClick;
      for (let i = 0; i < columns.length; i += 1) {
        this.filterColumnMap.set(columns[i].name, columns[i]);
      }

      this.oneClicks.push(oneClick);
    }

    this.updateLayoutFormats();
  }

  // We need to debounce adding series so we subscribe to them all in the same tick
  // This should no longer be necessary after IDS-5049 lands
  addPendingSeries = debounce(() => {
    const axisTypeMap = ChartUtils.getAxisTypeMap(this.figure);
    const { pendingSeries } = this;
    for (let i = 0; i < pendingSeries.length; i += 1) {
      const series = pendingSeries[i];
      const chart = this.figure.charts.find(c => c.series.includes(series));
      this.addSeries(series, axisTypeMap, chart?.showLegend ?? null);

      series.subscribe();
      // We'll get an update with the data after subscribing
    }

    this.pendingSeries = [];
  }, FigureChartModel.ADD_SERIES_DEBOUNCE);

  subscribe(callback: (event: ChartEvent) => void): void {
    super.subscribe(callback);

    if (this.listeners.length === 1) {
      // Need to initialize the series here as we may have missed some series when not subscribed
      this.initAllSeries();
      this.subscribeFigure();
    }
  }

  unsubscribe(callback: (event: ChartEvent) => void): void {
    super.unsubscribe(callback);

    if (this.listeners.length === 0) {
      this.unsubscribeFigure();
    }
  }

  subscribeFigure(): void {
    if (!this.isConnected) {
      log.debug('Ignoring subscribe when figure in disconnected state');
      return;
    }

    this.figure.subscribe(
      this.isDownsamplingDisabled
        ? this.dh.plot.DownsampleOptions.DISABLE
        : this.dh.plot.DownsampleOptions.DEFAULT
    );

    if (this.figure.errors.length > 0) {
      log.error('Errors in figure', this.figure.errors);
      this.fireError(this.figure.errors);
    }
  }

  unsubscribeFigure(): void {
    this.figure.unsubscribe();
  }

  startListeningFigure(): void {
    const { dh } = this;
    this.figure.addEventListener(
      dh.plot.Figure.EVENT_UPDATED,
      this.handleFigureUpdated
    );
    this.figure.addEventListener(
      dh.plot.Figure.EVENT_SERIES_ADDED,
      this.handleFigureSeriesAdded
    );
    this.figure.addEventListener(
      dh.plot.Figure.EVENT_DISCONNECT,
      this.handleFigureDisconnected
    );
    this.figure.addEventListener(
      dh.plot.Figure.EVENT_RECONNECT,
      this.handleFigureReconnected
    );
    this.figure.addEventListener(
      dh.plot.Figure.EVENT_DOWNSAMPLESTARTED,
      this.handleDownsampleStart
    );
    this.figure.addEventListener(
      dh.plot.Figure.EVENT_DOWNSAMPLEFINISHED,
      this.handleDownsampleFinish
    );
    this.figure.addEventListener(
      dh.plot.Figure.EVENT_DOWNSAMPLEFAILED,
      this.handleDownsampleFail
    );
    this.figure.addEventListener(
      dh.plot.Figure.EVENT_DOWNSAMPLENEEDED,
      this.handleDownsampleNeeded
    );
    this.figure.addEventListener(
      dh.Client.EVENT_REQUEST_FAILED,
      this.handleRequestFailed
    );
  }

  stopListeningFigure(): void {
    const { dh } = this;
    this.figure.removeEventListener(
      dh.plot.Figure.EVENT_UPDATED,
      this.handleFigureUpdated
    );
    this.figure.removeEventListener(
      dh.plot.Figure.EVENT_SERIES_ADDED,
      this.handleFigureSeriesAdded
    );
    this.figure.removeEventListener(
      dh.plot.Figure.EVENT_DISCONNECT,
      this.handleFigureDisconnected
    );
    this.figure.removeEventListener(
      dh.plot.Figure.EVENT_RECONNECT,
      this.handleFigureReconnected
    );
    this.figure.removeEventListener(
      dh.plot.Figure.EVENT_DOWNSAMPLESTARTED,
      this.handleDownsampleStart
    );
    this.figure.removeEventListener(
      dh.plot.Figure.EVENT_DOWNSAMPLEFINISHED,
      this.handleDownsampleFinish
    );
    this.figure.removeEventListener(
      dh.plot.Figure.EVENT_DOWNSAMPLEFAILED,
      this.handleDownsampleFail
    );
    this.figure.removeEventListener(
      dh.plot.Figure.EVENT_DOWNSAMPLENEEDED,
      this.handleDownsampleNeeded
    );
    this.figure.removeEventListener(
      dh.Client.EVENT_REQUEST_FAILED,
      this.handleRequestFailed
    );
  }

  getTimeZone = memoize(
    (columnType: string, formatter: Formatter | undefined) => {
      if (formatter != null) {
        const dataFormatter = formatter.getColumnTypeFormatter(columnType);
        if (dataFormatter != null) {
          return (dataFormatter as DateTimeColumnFormatter).dhTimeZone;
        }
      }
      return undefined;
    }
  );

  getValueTranslator = memoize(
    (columnType: string, formatter: Formatter | undefined) => {
      const timeZone = this.getTimeZone(columnType, formatter);
      return (value: unknown) => this.chartUtils.unwrapValue(value, timeZone);
    }
  );

  /** Gets the parser for a value with the provided column type */
  getValueParser = memoize(
    (columnType: string, formatter: Formatter | undefined) => {
      const timeZone = this.getTimeZone(columnType, formatter);
      return (value: unknown) =>
        this.chartUtils.wrapValue(value, columnType, timeZone);
    }
  );

  /**
   * Gets the range parser for a particular column type
   */
  getRangeParser = memoize(
    (columnType: string, formatter?: Formatter) => (range: Range) => {
      let [rangeStart, rangeEnd]: [unknown, unknown] = range;
      const valueParser = this.getValueParser(columnType, formatter);
      rangeStart = valueParser(rangeStart);
      rangeEnd = valueParser(rangeEnd);
      return [rangeStart, rangeEnd];
    }
  );

  /**
   * Gets the parser for parsing the range from an axis within the given chart
   */
  getAxisRangeParser = memoize(
    (chart: DhType.plot.Chart, formatter?: Formatter) =>
      (axis: DhType.plot.Axis) => {
        const source = ChartUtils.getSourceForAxis(chart, axis);
        if (source != null) {
          return this.getRangeParser(source.columnType, formatter);
        }

        return (range: [unknown, unknown]) => range;
      }
  );

  handleDownsampleStart(event: ChartEvent): void {
    log.debug('Downsample started', event);

    this.fireDownsampleStart(event.detail);
  }

  handleDownsampleFinish(event: ChartEvent): void {
    log.debug('Downsample finished', event);

    this.fireDownsampleFinish(event.detail);
  }

  handleDownsampleFail(event: ChartEvent): void {
    log.error('Downsample failed', event);

    this.fireDownsampleFail(event.detail);
  }

  handleDownsampleNeeded(event: ChartEvent): void {
    log.info('Downsample needed', event);

    this.fireDownsampleNeeded(event.detail);
  }

  handleFigureUpdated(event: DhType.Event<FigureUpdateEventData>): void {
    const { detail: figureUpdateEvent } = event;
    const { series: seriesArray } = figureUpdateEvent;

    log.debug2('handleFigureUpdated', seriesArray);

    for (let i = 0; i < seriesArray.length; i += 1) {
      const series = seriesArray[i];

      log.debug2('handleFigureUpdated updating series', series.name);

      const { sources } = series;
      for (let j = 0; j < sources.length; j += 1) {
        const source = sources[j];
        const { columnType, type } = source;
        const valueTranslator = this.getValueTranslator(
          columnType,
          this.formatter
        );
        const dataArray = figureUpdateEvent.getArray(
          series,
          type,
          valueTranslator
        );
        this.setDataArrayForSeries(series, type, dataArray);
      }

      this.seriesToProcess.delete(series.name);

      this.cleanSeries(series);
    }
    if (this.seriesToProcess.size === 0) {
      this.fireLoadFinished();
    }

    const { data } = this;
    this.fireUpdate(data);
  }

  handleRequestFailed(event: ChartEvent): void {
    log.error('Request failed', event);
    this.fireError([`${event.detail}`]);
  }

  /**
   * Resubscribe to the figure, should be done if settings change
   */
  resubscribe(): void {
    if (this.listeners.length > 0) {
      this.unsubscribeFigure();
      this.subscribeFigure();
    }
  }

  setFormatter(formatter: Formatter): void {
    super.setFormatter(formatter);

    this.updateLayoutFormats();

    // Unsubscribe and resubscribe to trigger a data update
    // Data may need to be translated again because of the new formatter
    this.resubscribe();
  }

  setRenderOptions(renderOptions: RenderOptions): void {
    super.setRenderOptions(renderOptions);

    // Reset all the series to re-render them with the correct rendering options
    this.initAllSeries();
  }

  setDownsamplingDisabled(isDownsamplingDisabled: boolean): void {
    super.setDownsamplingDisabled(isDownsamplingDisabled);

    this.resubscribe();
  }

  handleFigureDisconnected(event: DhType.Event<unknown>): void {
    log.debug('Figure disconnected', event);

    this.isConnected = false;

    if (this.listeners.length > 0) {
      this.unsubscribeFigure();
    }

    this.fireDisconnect();
  }

  handleFigureReconnected(event: DhType.Event<unknown>): void {
    log.debug('Figure reconnected', event);

    this.isConnected = true;

    // It's possible the series have changed completely, as the query could have been changed
    this.initAllSeries();

    this.fireReconnect();

    if (this.listeners.length > 0) {
      this.subscribeFigure();
    }
  }

  handleFigureSeriesAdded(event: { detail: DhType.plot.Series }): void {
    const { detail: series } = event;
    log.debug('handleFigureSeriesAdded', series);

    this.pendingSeries.push(series);
    this.addPendingSeries();
  }

  setDimensions(rect: DOMRect): void {
    super.setDimensions(rect);

    this.updateAxisPositions();
  }

  setTitle(title: string): void {
    super.setTitle(title);

    // Need to recalculate the padding based on how many lines of text the title is
    // Plotly doesn't handle positioning it correctly, and it's an undocumented feature
    const subtitleCount = (title ?? '').match(/<br>/g)?.length ?? 0;
    const margin =
      ChartUtils.DEFAULT_MARGIN.t +
      subtitleCount * ChartUtils.SUBTITLE_LINE_HEIGHT;

    if (this.layout.margin) {
      this.layout.margin.t = margin;
    } else {
      this.layout.margin = { t: margin };
    }

    if (typeof this.layout.title === 'string') {
      this.layout.title = title;
    } else {
      this.layout.title = { ...this.layout.title };
      this.layout.title.text = title;
      this.layout.title.pad = { ...this.layout.title.pad };
      this.layout.title.pad.t =
        ChartUtils.DEFAULT_TITLE_PADDING.t +
        subtitleCount * ChartUtils.SUBTITLE_LINE_HEIGHT * 0.5;
    }
  }

  getPlotWidth(): number {
    if (!this.rect || !this.rect.width) {
      return 0;
    }

    return Math.max(
      this.rect.width -
        (this.layout.margin?.l ?? 0) -
        (this.layout.margin?.r ?? 0),
      0
    );
  }

  getPlotHeight(): number {
    if (!this.rect || !this.rect.height) {
      return 0;
    }

    return Math.max(
      this.rect.height -
        (this.layout.margin?.t ?? 0) -
        (this.layout.margin?.b ?? 0),
      0
    );
  }

  updateAxisPositions(): void {
    const plotWidth = this.getPlotWidth();
    const plotHeight = this.getPlotHeight();
    this.chartUtils.updateFigureAxes(
      this.layout,
      this.figure,
      chart => this.getAxisRangeParser(chart, this.formatter),
      plotWidth,
      plotHeight
    );
  }

  /**
   * Updates the format patterns used
   */
  updateLayoutFormats(): void {
    if (!this.formatter) {
      return;
    }

    const axisFormats = this.chartUtils.getAxisFormats(
      this.figure,
      this.formatter
    );
    axisFormats.forEach((axisFormat, axisLayoutProperty) => {
      log.debug(
        `Assigning ${axisLayoutProperty}`,
        this.layout[axisLayoutProperty],
        axisFormat
      );

      const props = this.layout[axisLayoutProperty];
      if (props != null) {
        Object.assign(props, axisFormat);
      } else {
        log.debug(`Ignoring null layout.${axisLayoutProperty}`);
      }
    });
  }

  /**
   * Set a specific array for the array of series properties specified.
   * @param series The series to set the data array for.
   * @param sourceType The source type within that series to set the data for.
   * @param dataArray The array to use for the data for this series source.
   */
  setDataArrayForSeries(
    series: DhType.plot.Series,
    sourceType: DhType.plot.SourceType,
    dataArray: unknown[]
  ): void {
    const { name, plotStyle } = series;

    const seriesData = this.seriesDataMap.get(name);
    const property = this.chartUtils.getPlotlyProperty(plotStyle, sourceType);

    if (seriesData) {
      set(seriesData, property, dataArray);
    }
  }

  /**
   * After setting all the data in the series data, we may need to adjust some other properties
   * Eg. Calculating the width from the xLow/xHigh values; Plot.ly uses `width` instead of a low/high
   * value for x.
   * @param series The series to clean the data for
   */
  cleanSeries(series: DhType.plot.Series): void {
    const { dh } = this;
    const { name, plotStyle } = series;
    const seriesData = this.seriesDataMap.get(name);
    if (seriesData == null) {
      return;
    }
    if (plotStyle === dh.plot.SeriesPlotStyle.HISTOGRAM) {
      const { xLow, xHigh } = seriesData;
      if (xLow && xHigh && xLow.length === xHigh.length) {
        const width = [];
        for (let i = 0; i < xLow.length; i += 1) {
          width.push(xHigh[i] - xLow[i]);
        }
        seriesData.width = width;
      }
    } else if (
      plotStyle === dh.plot.SeriesPlotStyle.LINE ||
      plotStyle === dh.plot.SeriesPlotStyle.ERROR_BAR ||
      plotStyle === dh.plot.SeriesPlotStyle.BAR
    ) {
      const { x, xLow, xHigh, y, yLow, yHigh } = seriesData;
      if (xLow && xHigh && xLow !== x) {
        seriesData.error_x = ChartUtils.getPlotlyErrorBars(
          x as number[],
          xLow,
          xHigh
        );
      }
      if (yLow && yHigh && yLow !== y) {
        seriesData.error_y = ChartUtils.getPlotlyErrorBars(
          y as number[],
          yLow,
          yHigh
        );
      }
    } else if (plotStyle === dh.plot.SeriesPlotStyle.TREEMAP) {
      const { ids, labels } = seriesData;
      if (ids !== undefined && labels === undefined) {
        // If the user only provided IDs, we assign the IDs to the labels property as well automatically
        // Plotly uses the labels primarily, which from our API perspective seems kind of backwards
        seriesData.labels = ids;
      }
    }
  }

  getData(): Partial<Data>[] {
    return this.data;
  }

  getLayout(): Partial<Layout> {
    return this.layout;
  }

  getFilterColumnMap(): FilterColumnMap {
    return new Map(this.filterColumnMap);
  }

  isFilterRequired(): boolean {
    return (
      this.oneClicks.find(oneClick => oneClick.requireAllFiltersToDisplay) !=
      null
    );
  }

  /**
   * Sets the filter on the model. Will only set the values that have changed.
   * @param filterMap Map of filter column names to values
   */
  setFilter(filterMap: FilterMap): void {
    if (this.oneClicks.length === 0) {
      log.warn('Trying to set a filter, but no one click!');
      return;
    }

    log.debug('setFilter', filterMap);

    for (let i = 0; i < this.oneClicks.length; i += 1) {
      const oneClick = this.oneClicks[i];
      const { columns } = oneClick;
      // Need to get all the keys in case a filter was removed
      const keys = new Set([...filterMap.keys(), ...this.lastFilter.keys()]);
      keys.forEach(key => {
        const value = filterMap.get(key);
        if (
          this.lastFilter.get(key) !== value &&
          columns.find(column => column.name === key) != null
        ) {
          oneClick.setValueForColumn(key, value);
        }
      });
    }

    this.lastFilter = new Map(filterMap);
  }

  setFigure(figure: DhType.plot.Figure): void {
    this.close();

    this.figure = figure;

    this.setTitle(this.getDefaultTitle());
    this.initAllSeries();
    this.updateAxisPositions();
    this.startListeningFigure();
    if (this.listeners.length > 0) {
      this.subscribeFigure();
    }
  }

  updateSettings(settings: Partial<ChartModelSettings>): void {
    this.settings = settings;
  }
}

export default FigureChartModel;
