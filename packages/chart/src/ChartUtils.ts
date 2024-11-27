import Log from '@deephaven/log';
import {
  type DateTimeColumnFormatter,
  type Formatter,
  type TableColumnFormatter,
  TableUtils,
} from '@deephaven/jsapi-utils';
import type { dh as DhType } from '@deephaven/jsapi-types';
import set from 'lodash.set';
import type {
  Layout,
  PlotData,
  PlotType,
  Axis as PlotlyAxis,
  ErrorBar,
  LayoutAxis,
  AxisType as PlotlyAxisType,
  MarkerSymbol,
  Template,
} from 'plotly.js';
import { assertNotNull, bindAllMethods, type Range } from '@deephaven/utils';
import { type ChartTheme } from './ChartTheme';

export type FilterColumnMap = Map<
  string,
  {
    name: string;
    type: string;
  }
>;

export type FilterMap = Map<string, unknown>;

export interface ChartModelSettings {
  hiddenSeries?: string[];
  type?: keyof DhType.plot.SeriesPlotStyle;
  series?: string[];
  xAxis?: string;
  title?: string;
}

export interface SeriesData {
  type: string | null;
  mode: string | null;
  name: string;
  orientation: string;
  xaxis?: number;
  marker?: unknown;
  xLow?: number;
  xHigh?: number;
}

export type RangeParser = (range: Range) => unknown[];

export type AxisRangeParser = (axis: DhType.plot.Axis) => RangeParser;

export type ChartAxisRangeParser = (
  chart: DhType.plot.Chart
) => AxisRangeParser;

type LayoutAxisKey =
  | 'xaxis'
  | 'xaxis2'
  | 'xaxis3'
  | 'xaxis4'
  | 'xaxis5'
  | 'xaxis6'
  | 'xaxis7'
  | 'xaxis8'
  | 'xaxis9'
  | 'yaxis'
  | 'yaxis2'
  | 'yaxis3'
  | 'yaxis4'
  | 'yaxis5'
  | 'yaxis6'
  | 'yaxis7'
  | 'yaxis8'
  | 'yaxis9';

export interface TreeMapData extends PlotData {
  tiling: {
    packing: 'squarify';
    pad: 0;
  };
}

interface Rangebreaks {
  bounds?: number[];
  dvalue?: number;
  enable?: boolean;
  name?: string;
  pattern?: 'day of week' | 'hour' | '';
  values?: string[];
}
interface RangebreakAxisFormat extends PlotlyAxis {
  rangebreaks: Rangebreaks[];
}

export type ChartBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type AxisTypeMap = Map<DhType.plot.AxisType, DhType.plot.Axis[]>;
type AxisPositionMap = Map<DhType.plot.AxisPosition, DhType.plot.Axis[]>;

const log = Log.module('ChartUtils');

const BUSINESS_COLUMN_TYPE = 'io.deephaven.time.DateTime';

const MILLIS_PER_HOUR = 3600000;

const NANOS_PER_MILLI = 1000000;

function isDateWrapper(value: unknown): value is DhType.DateWrapper {
  return (value as DhType.DateWrapper).asDate !== undefined;
}

function isLongWrapper(value: unknown): value is DhType.LongWrapper {
  return (value as DhType.LongWrapper).asNumber !== undefined;
}

function isDateTimeColumnFormatter(
  value: TableColumnFormatter
): value is DateTimeColumnFormatter {
  return (value as DateTimeColumnFormatter).dhTimeZone !== undefined;
}

function isRangedPlotlyAxis(value: unknown): value is { range: Range[] } {
  return (
    value != null &&
    (value as PlotlyAxis).range != null &&
    ((value as PlotlyAxis).autorange === false ||
      (value as PlotlyAxis).autorange === undefined)
  );
}

/**
 * Check if WebGL is supported in the current environment.
 * Most modern browsers do support WebGL, but it's possible to disable it and it is also not available
 * in some headless environments, which can affect e2e tests.
 *
 * https://github.com/microsoft/playwright/issues/13146
 * https://bugzilla.mozilla.org/show_bug.cgi?id=1375585
 *
 * @returns True if Web GL is supported, false otherwise
 */
function isWebGLSupported(): boolean {
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Detect_WebGL
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  return gl != null && gl instanceof WebGLRenderingContext;
}

const IS_WEBGL_SUPPORTED = isWebGLSupported();

class ChartUtils {
  static DEFAULT_AXIS_SIZE = 0.15;

  static MIN_AXIS_SIZE = 0.025;

  static MAX_AXIS_SIZE = 0.2;

  static AXIS_SIZE_PX = 75;

  static LEGEND_WIDTH_PX = 50;

  static MAX_LEGEND_SIZE = 0.25;

  static ORIENTATION = Object.freeze({
    HORIZONTAL: 'h',
    VERTICAL: 'v',
  } as const);

  static DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSSSSS';

  static DEFAULT_MARGIN = Object.freeze({ l: 60, r: 50, t: 30, b: 60, pad: 0 });

  static DEFAULT_TITLE_PADDING = Object.freeze({ t: 8 });

  static SUBTITLE_LINE_HEIGHT = 25;

  static DEFAULT_MARKER_SIZE = 6;

  static MODE_MARKERS: PlotData['mode'] = 'markers';

  static MODE_LINES: PlotData['mode'] = 'lines';

  /**
   * Generate the plotly error bar data from the passed in data.
   * Iris passes in the values as absolute, plotly needs them as relative.
   * @param x The main data array
   * @param xLow The absolute low values
   * @param xHigh
   *
   * @returns The error_x object required by plotly, or null if none is required
   */
  static getPlotlyErrorBars(
    x: number[],
    xLow: number[],
    xHigh: number[]
  ): ErrorBar {
    const array = xHigh.map((value, i) => value - x[i]);
    const arrayminus = xLow.map((value, i) => x[i] - value);
    return {
      type: 'data',
      symmetric: false,
      array,
      arrayminus,
    };
  }

  static convertNumberPrefix(prefix: string): string {
    return prefix.replace(/\u00A4\u00A4/g, 'USD').replace(/\u00A4/g, '$');
  }

  static getPlotlyNumberFormat(
    formatter: Formatter | null,
    columnType: string,
    formatPattern: string | null | undefined
  ): Partial<LayoutAxis> | null {
    if (formatPattern == null || formatPattern === '') {
      return null;
    }

    // We translate java formatting: https://docs.oracle.com/javase/7/docs/api/java/text/DecimalFormat.html
    // Into d3 number formatting: https://github.com/d3/d3-format
    // We can't translate number formatting exactly, but should be able to translate the most common cases
    // First split it into the subpatterns; currently only handling the positive subpattern, ignoring the rest
    const subpatterns = formatPattern.split(';');

    const matchArray = subpatterns[0].match(
      /^([^#,0.]*)([#,]*)([0,]*)(\.?)(0*)(#*)(E?0*)(%?)(.*)/
    );
    assertNotNull(matchArray);

    const [
      ,
      prefix,
      placeholderDigits,
      zeroDigits,
      ,
      decimalDigits,
      optionalDecimalDigits,
      numberType,
      percentSign,
      suffix,
    ] = matchArray;

    const paddingLength = zeroDigits.replace(',', '').length;
    const isCommaSeparated =
      placeholderDigits.indexOf(',') >= 0 || zeroDigits.indexOf(',') >= 0;
    const comma = isCommaSeparated ? ',' : '';
    const plotlyNumberType =
      numberType != null && numberType !== '' ? 'e' : 'f';

    const type = percentSign !== '' ? percentSign : plotlyNumberType;

    const decimalLength = decimalDigits.length + optionalDecimalDigits.length;
    // IDS-4565 Plotly uses an older version of d3 which doesn't support the trim option or negative brackets
    // If plotly updates it's d3 version, this should be re-enabled
    // const trimOption = optionalDecimalDigits.length > 0 ? '~' : '';
    const trimOption = '';

    const tickformat = `0${paddingLength}${comma}.${decimalLength}${trimOption}${type}`;
    const tickprefix = ChartUtils.convertNumberPrefix(prefix);
    // prefix and suffix are processed the same
    const ticksuffix = ChartUtils.convertNumberPrefix(suffix);

    return { tickformat, tickprefix, ticksuffix, automargin: true };
  }

  /**
   * Adds tick spacing for an axis that has gapBetweenMajorTicks defined.
   *
   * @param axisFormat the current axis format, may be null
   * @param axis the current axis
   * @param isDateType indicates if the columns is a date type
   */
  static addTickSpacing(
    axisFormat: Partial<LayoutAxis> | null,
    axis: DhType.plot.Axis,
    isDateType: boolean
  ): Partial<PlotlyAxis> | null {
    const { gapBetweenMajorTicks } = axis;
    if (gapBetweenMajorTicks != null && gapBetweenMajorTicks > 0) {
      const updatedFormat: Partial<PlotlyAxis> = axisFormat || {};
      let tickSpacing = gapBetweenMajorTicks;
      if (isDateType) {
        // Need to convert from nanoseconds to milliseconds
        tickSpacing = gapBetweenMajorTicks / NANOS_PER_MILLI;
      }
      if (axis.log) {
        tickSpacing = Math.log(tickSpacing);
      }
      // Note that tickmode defaults to 'auto'
      updatedFormat.tickmode = 'linear';
      updatedFormat.dtick = tickSpacing;
      return updatedFormat;
    }

    return axisFormat;
  }

  /**
   * Retrieve the data source for a given axis in a chart
   * @param chart The chart to get the source for
   * @param axis The axis to find the source for
   * @returns The first source matching this axis
   */
  static getSourceForAxis(
    chart: DhType.plot.Chart,
    axis: DhType.plot.Axis
  ): DhType.plot.SeriesDataSource | null {
    for (let i = 0; i < chart.series.length; i += 1) {
      const series = chart.series[i];
      for (let j = 0; j < series.sources.length; j += 1) {
        const source = series.sources[j];
        if (source.axis === axis) {
          return source;
        }
      }
    }

    return null;
  }

  /**
   * Get visibility setting for the series object
   * @param  name The series name to get the visibility for
   * @param  settings Chart settings
   * @returns True for visible series and 'legendonly' for hidden
   */
  static getSeriesVisibility(
    name: string,
    settings?: Partial<ChartModelSettings>
  ): boolean | 'legendonly' {
    if (
      settings != null &&
      settings.hiddenSeries != null &&
      settings.hiddenSeries.includes(name)
    ) {
      return 'legendonly';
    }
    return true;
  }

  /**
   * Get hidden labels array from chart settings
   * @param settings Chart settings
   * @returns Array of hidden series names
   */
  static getHiddenLabels(settings: Partial<ChartModelSettings>): string[] {
    if (settings?.hiddenSeries) {
      return [...settings.hiddenSeries];
    }
    return [];
  }

  /**
   * Create a default series data object. Apply styling to the object afterward.
   * @returns A simple series data object with no styling
   */
  static makeSeriesData(
    type: PlotType | undefined,
    mode: PlotData['mode'] | undefined,
    name: string,
    showLegend: boolean | null,
    orientation: 'h' | 'v' = ChartUtils.ORIENTATION.VERTICAL
  ): Partial<PlotData> {
    return {
      type,
      mode,
      name,
      orientation,
      showlegend: showLegend ?? undefined,
    };
  }

  /**
   * Get the Plotly marker symbol for the provided Deephaven shape
   * Deephaven shapes: https://deephaven.io/enterprise/docs/plotting/visual-formatting/#point-formatting
   * Plotly shapes: https://plotly.com/javascript/reference/scattergl/#scattergl-marker-symbol
   * Table of plotly shapes: https://plotly.com/python/marker-style/#custom-marker-symbols
   * @param deephavenShape Deephaven shape to get the marker symbol for
   */
  static getMarkerSymbol(deephavenShape: string): MarkerSymbol {
    switch (deephavenShape) {
      case 'SQUARE':
        return 'square';
      case 'CIRCLE':
        return 'circle';
      case 'DIAMOND':
        return 'diamond';
      case 'UP_TRIANGLE':
        return 'triangle-up';
      case 'DOWN_TRIANGLE':
        return 'triangle-down';
      case 'RIGHT_TRIANGLE':
        return 'triangle-right';
      case 'LEFT_TRIANGLE':
        return 'triangle-left';
      // There don't seem to be any plotly equivalents for ellipse or rectangles
      // Rectangles could be `line-ew`, `line-ns`, or `hourglass` and `bowtie` instead?
      // Ellipse could be `asterisk` or `diamond-wide` instead?
      // Just throw an error, we've already got a bunch of types.
      case 'ELLIPSE':
      case 'HORIZONTAL_RECTANGLE':
      case 'VERTICAL_RECTANGLE':
      default:
        throw new Error(`Unrecognized shape ${deephavenShape}`);
    }
  }

  /**
   * Get all axes for a given `Figure`. Iterates through all charts axes and concatenates them.
   * @param figure Figure to get all axes for
   */
  static getAllAxes(figure: DhType.plot.Figure): DhType.plot.Axis[] {
    return figure.charts.reduce(
      (axes, chart) => [...axes, ...chart.axes],
      [] as DhType.plot.Axis[]
    );
  }

  /**
   * Get the axis type map for the figure provided
   * @param figure Figure to get the type map for
   * @returns Axis type map for the figure provided
   */
  static getAxisTypeMap(figure: DhType.plot.Figure): AxisTypeMap {
    const axes = ChartUtils.getAllAxes(figure);
    return ChartUtils.groupArray(axes, 'type');
  }

  /**
   * Retrieve the chart that contains the passed in series from the figure
   * @param figure The figure to retrieve the chart from
   * @param series The series to get the chart for
   */
  static getChartForSeries(
    figure: DhType.plot.Figure,
    series: DhType.plot.Series
  ): DhType.plot.Chart | null {
    const { charts } = figure;

    for (let i = 0; i < charts.length; i += 1) {
      const chart = charts[i];
      for (let j = 0; j < chart.series.length; j += 1) {
        if (series === chart.series[j]) {
          return chart;
        }
      }
    }

    return null;
  }

  /**
   * Get an object mapping axis to their ranges
   * @param layout The plotly layout object to get the ranges from
   * @returns An object mapping the axis name to it's range
   */
  static getLayoutRanges(layout: Partial<Layout>): Record<string, Range[]> {
    const ranges: Record<string, Range[]> = {};
    const keys: (keyof Layout)[] = Object.keys(layout).filter(
      key => key.indexOf('axis') >= 0
    ) as LayoutAxisKey[];
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = layout[key];
      if (isRangedPlotlyAxis(value)) {
        // Only want to add the range if it's not autoranged
        ranges[key] = [...(value as PlotlyAxis).range];
      }
    }

    return ranges;
  }

  static getAxisLayoutProperty(
    axisProperty: 'x' | 'y',
    axisIndex: number
  ): LayoutAxisKey {
    const axisIndexString = axisIndex > 0 ? `${axisIndex + 1}` : '';
    return `${axisProperty ?? ''}axis${axisIndexString}` as LayoutAxisKey;
  }

  /**
   * Converts an open or close period to a declimal. e.g '09:30" to 9.5
   *
   * @param period the open or close value of the period
   */
  static periodToDecimal(period: string): number {
    const values = period.split(':');
    return Number(values[0]) + Number(values[1]) / 60;
  }

  /**
   * Converts a decimal to a period. e.g 9.5 to '09:30'
   *
   * @param decimal the decimal value to
   */
  static decimalToPeriod(decimal: number): string {
    const hours = Math.floor(decimal);
    const minutes = Math.round((decimal - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  /**
   * Groups an array and returns a map
   * @param array The object to group
   * @param property The property name to group by
   * @returns A map containing the items grouped by their values for the property
   */
  static groupArray<T, P extends keyof T>(
    array: T[],
    property: P
  ): Map<T[P], T[]> {
    return array.reduce((result, item) => {
      const key = item[property];
      const group: T[] = result.get(key) ?? [];
      group.push(item);
      result.set(key, group);
      return result;
    }, new Map());
  }

  /**
   * Parses the colorway value of a theme and returns an array of colors
   * Value could be a single string with space separated colors or already be an
   * array of strings representing the colorway
   * @param colorway The colorway value to normalize
   * @returns Colorway array for the theme or undefined
   */
  static normalizeColorway(colorway?: string | string[]): string[] | undefined {
    if (colorway == null) {
      return;
    }

    if (Array.isArray(colorway)) {
      return colorway;
    }

    if (typeof colorway === 'string') {
      return colorway.split(' ');
    }

    log.warn(`Unexpected colorway format: ${colorway}`);
  }

  static titleFromSettings(settings: ChartModelSettings): string {
    const {
      series,
      xAxis,
      title = `${(series ?? []).join(', ')} by ${xAxis}`,
    } = settings;

    return title;
  }

  static getTimeZoneDiff(
    calendarTimeZone: DhType.i18n.TimeZone,
    formatterTimeZone?: DhType.i18n.TimeZone
  ): number {
    return formatterTimeZone
      ? (calendarTimeZone.standardOffset - formatterTimeZone.standardOffset) /
          60
      : 0;
  }

  /**
   * Creates closed periods for a partial holiday.
   *
   * @param holidayPeriods the business periods for the holiday
   * @param calendarPeriods the business periods for the calendar
   * @returns an array of closed ranges for the partial holiday. Should be the ranges during the regular business hours that are _not_ specified by the holiday periods.
   */
  static createClosedRangesForPartialHoliday(
    holidayPeriods: DhType.calendar.BusinessPeriod[],
    calendarPeriods: DhType.calendar.BusinessPeriod[]
  ): Range[] {
    // First restrict the periods to only those that are actual business periods.
    const calendarRanges: Range[] = calendarPeriods.map(period => [
      ChartUtils.periodToDecimal(period.open),
      ChartUtils.periodToDecimal(period.close),
    ]);
    calendarRanges.sort((a, b) => a[0] - b[0]);
    if (calendarRanges.length === 0) {
      calendarRanges.push([0, 24]);
    }
    const holidayRanges: Range[] = holidayPeriods.map(period => [
      ChartUtils.periodToDecimal(period.open),
      ChartUtils.periodToDecimal(period.close),
    ]);
    holidayRanges.sort((a, b) => a[0] - b[0]);

    const closedRanges: Range[] = [];

    // Separate index cursor for the holiday ranges
    for (let c = 0; c < calendarRanges.length; c += 1) {
      const calendarRange = calendarRanges[c];
      let lastClose = calendarRange[0];
      for (let h = 0; h < holidayRanges.length; h += 1) {
        const holidayRange = holidayRanges[h];
        if (holidayRange[1] > lastClose && holidayRange[0] < calendarRange[1]) {
          if (holidayRange[0] > lastClose) {
            closedRanges.push([lastClose, holidayRange[0]]);
          }
          // eslint-disable-next-line prefer-destructuring
          lastClose = holidayRange[1];
        }
      }
      if (lastClose < calendarRange[1]) {
        closedRanges.push([lastClose, calendarRange[1]]);
      }
    }
    return closedRanges;
  }

  private dh: typeof DhType;

  private daysOfWeek: readonly string[];

  constructor(dh: typeof DhType) {
    this.dh = dh;
    this.daysOfWeek = Object.freeze(dh.calendar.DayOfWeek.values());
    bindAllMethods(this);
  }

  /**
   * Retrieve the axis formats from the provided figure.
   * Currently defaults to just the x/y axes.
   * @param figure The figure to get the axis formats for
   * @param formatter The formatter to use when getting the axis format
   * @returns A map of axis layout property names to axis formats
   */
  getAxisFormats(
    figure: DhType.plot.Figure,
    formatter: Formatter
  ): Map<LayoutAxisKey, Partial<PlotlyAxis>> {
    const axisFormats = new Map();
    const nullFormat = { tickformat: null, ticksuffix: null };

    const allAxes = ChartUtils.getAllAxes(figure);
    const axisTypeMap = ChartUtils.groupArray(allAxes, 'type');
    const { charts } = figure;

    for (let i = 0; i < charts.length; i += 1) {
      const chart = charts[i];

      for (let j = 0; j < chart.series.length; j += 1) {
        const series = chart.series[j];
        const { sources } = series;
        const axisSources = sources.filter(source => source.axis);
        for (let k = 0; k < axisSources.length; k += 1) {
          const source = axisSources[k];
          const { axis } = source;
          const { type: axisType } = axis;
          const typeAxes = axisTypeMap.get(axisType);
          assertNotNull(typeAxes);
          const axisIndex = typeAxes.indexOf(axis);
          const axisProperty = this.getAxisPropertyName(axisType);
          if (axisProperty != null) {
            const axisLayoutProperty = ChartUtils.getAxisLayoutProperty(
              axisProperty,
              axisIndex
            );

            if (axisFormats.has(axisLayoutProperty)) {
              log.debug(`${axisLayoutProperty} already added.`);
            } else {
              log.debug(`Adding ${axisLayoutProperty} to axisFormats.`);
              const axisFormat = this.getPlotlyAxisFormat(source, formatter);
              if (axisFormat === null) {
                axisFormats.set(axisLayoutProperty, nullFormat);
              } else {
                axisFormats.set(axisLayoutProperty, axisFormat);

                const { businessCalendar } = axis;
                if (businessCalendar != null) {
                  (axisFormat as RangebreakAxisFormat).rangebreaks =
                    this.createRangeBreaksFromBusinessCalendar(
                      businessCalendar,
                      formatter
                    );
                }

                if (axisFormats.size === chart.axes.length) {
                  return axisFormats;
                }
              }
            }
          }
        }
      }
    }

    return axisFormats;
  }

  /**
   * Converts the Iris plot style into a plotly chart type
   * @param plotStyle The plotStyle to use, see dh.plot.SeriesPlotStyle
   * @param isBusinessTime If the plot is using business time for an axis
   * @param allowWebGL If WebGL is allowedd
   */
  getPlotlyChartType(
    plotStyle: DhType.plot.SeriesPlotStyle,
    isBusinessTime: boolean,
    allowWebGL = true
  ): PlotType | undefined {
    const { dh } = this;
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.SCATTER:
      case dh.plot.SeriesPlotStyle.LINE:
        // scattergl mode is more performant (usually), but doesn't support the rangebreaks we need for businessTime calendars
        // In some cases, WebGL is less performant (like in virtual desktop environments), so we also allow the option of the user explicitly disabling it even if it's supported
        return !isBusinessTime && IS_WEBGL_SUPPORTED && allowWebGL
          ? 'scattergl'
          : 'scatter';
      case dh.plot.SeriesPlotStyle.BAR:
      case dh.plot.SeriesPlotStyle.STACKED_BAR:
        return 'bar';

      case dh.plot.SeriesPlotStyle.PIE:
        return 'pie';

      case dh.plot.SeriesPlotStyle.TREEMAP:
        return 'treemap';

      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        return 'histogram';

      case dh.plot.SeriesPlotStyle.OHLC:
        return 'ohlc';

      default:
        return undefined;
    }
  }

  /**
   * Converts the Iris plot style into a plotly chart mode
   * @param plotStyle The plotStyle to use, see dh.plot.SeriesPlotStyle.*
   * @param areLinesVisible Whether lines are visible or not
   * @param areShapesVisible Whether shapes are visible or not
   */
  getPlotlyChartMode(
    plotStyle: DhType.plot.SeriesPlotStyle,
    areLinesVisible?: boolean | null,
    areShapesVisible?: boolean | null
  ): PlotData['mode'] | undefined {
    const { dh } = this;
    const modes = new Set<PlotData['mode']>();

    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.SCATTER:
        // Default to only showing shapes in scatter plots
        if (areLinesVisible ?? false) {
          modes.add(ChartUtils.MODE_LINES);
        }
        if (areShapesVisible ?? true) {
          modes.add(ChartUtils.MODE_MARKERS);
        }
        break;
      case dh.plot.SeriesPlotStyle.LINE:
        // Default to only showing lines in line series
        if (areLinesVisible ?? true) {
          modes.add(ChartUtils.MODE_LINES);
        }
        if (areShapesVisible ?? false) {
          modes.add(ChartUtils.MODE_MARKERS);
        }
        break;
      default:
        break;
    }

    return modes.size > 0
      ? ([...modes].join('+') as PlotData['mode'])
      : undefined;
  }

  /**
   * Get the property to set on the series data for plotly
   * @param plotStyle The plot style of the series
   * @param sourceType The source type for the series
   */
  getPlotlyProperty(
    plotStyle: DhType.plot.SeriesPlotStyle,
    sourceType: DhType.plot.SourceType
  ): string {
    const { dh } = this;
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.PIE:
        switch (sourceType) {
          case dh.plot.SourceType.X:
            return 'labels';
          case dh.plot.SourceType.Y:
            return 'values';
          default:
            break;
        }
        break;
      case dh.plot.SeriesPlotStyle.OHLC:
        switch (sourceType) {
          case dh.plot.SourceType.TIME:
            return 'x';
          default:
            break;
        }
        break;
      case dh.plot.SeriesPlotStyle.TREEMAP:
        switch (sourceType) {
          case dh.plot.SourceType.X:
            return 'ids';
          case dh.plot.SourceType.Y:
            return 'values';
          case dh.plot.SourceType.LABEL:
            return 'labels';
          case dh.plot.SourceType.PARENT:
            return 'parents';
          case dh.plot.SourceType.COLOR:
            return 'marker.colors';
          default:
            break;
        }
        break;
      default:
        break;
    }

    switch (sourceType) {
      case dh.plot.SourceType.X:
        return 'x';
      case dh.plot.SourceType.Y:
        return 'y';
      case dh.plot.SourceType.Z:
        return 'z';
      case dh.plot.SourceType.X_LOW:
        return 'xLow';
      case dh.plot.SourceType.X_HIGH:
        return 'xHigh';
      case dh.plot.SourceType.Y_LOW:
        return 'yLow';
      case dh.plot.SourceType.Y_HIGH:
        return 'yHigh';
      case dh.plot.SourceType.TIME:
        return 'time';
      case dh.plot.SourceType.OPEN:
        return 'open';
      case dh.plot.SourceType.HIGH:
        return 'high';
      case dh.plot.SourceType.LOW:
        return 'low';
      case dh.plot.SourceType.CLOSE:
        return 'close';
      case dh.plot.SourceType.SHAPE:
        return 'shape';
      case dh.plot.SourceType.SIZE:
        return 'size';
      case dh.plot.SourceType.LABEL:
        return 'label';
      case dh.plot.SourceType.COLOR:
        return 'color';
      case dh.plot.SourceType.PARENT:
        return 'parent';
      case dh.plot.SourceType.HOVER_TEXT:
        return 'hovertext';
      case dh.plot.SourceType.TEXT:
        return 'text';
      default:
        throw new Error(`Unrecognized source type: ${sourceType}`);
    }
  }

  getPlotlySeriesOrientation(
    series: DhType.plot.Series
  ): 'h' | 'v' | undefined {
    const { dh } = this;
    const { sources } = series;
    if (sources.length === 2 && sources[0]?.axis?.type === dh.plot.AxisType.Y) {
      return ChartUtils.ORIENTATION.HORIZONTAL;
    }

    return ChartUtils.ORIENTATION.VERTICAL;
  }

  /**
   * Create a data series (trace) for use with plotly
   * @param series The series to create the series data with
   * @param axisTypeMap The map of axes grouped by type
   * @param seriesVisibility Visibility setting for the series
   * @returns The series data (trace) object for use with plotly.
   */
  makeSeriesDataFromSeries(
    series: DhType.plot.Series,
    axisTypeMap: AxisTypeMap,
    seriesVisibility: boolean | 'legendonly',
    showLegend: boolean | null = null,
    allowWebGL = true
  ): Partial<PlotData> {
    const {
      name,
      isLinesVisible,
      isShapesVisible,
      plotStyle,
      lineColor,
      shapeColor,
      sources,
      shape,
      shapeSize,
    } = series;

    const isBusinessTime = sources.some(
      source => source.axis?.businessCalendar
    );
    const type = this.getChartType(plotStyle, isBusinessTime, allowWebGL);
    const mode = this.getPlotlyChartMode(
      plotStyle,
      isLinesVisible ?? undefined,
      isShapesVisible ?? undefined
    );
    const orientation = this.getPlotlySeriesOrientation(series);
    const seriesData = ChartUtils.makeSeriesData(
      type,
      mode,
      name,
      showLegend,
      orientation
    );

    this.addSourcesToSeriesData(seriesData, plotStyle, sources, axisTypeMap);

    this.addStylingToSeriesData(
      seriesData,
      plotStyle,
      lineColor,
      shapeColor,
      shape,
      shapeSize,
      seriesVisibility
    );

    return seriesData;
  }

  addSourcesToSeriesData(
    seriesDataParam: Partial<PlotData>,
    plotStyle: DhType.plot.SeriesPlotStyle,
    sources: DhType.plot.SeriesDataSource[],
    axisTypeMap: AxisTypeMap
  ): void {
    const seriesData = seriesDataParam;
    for (let k = 0; k < sources.length; k += 1) {
      const source = sources[k];
      const { axis, type: sourceType } = source;

      const dataAttributeName = this.getPlotlyProperty(plotStyle, sourceType);
      set(seriesData, dataAttributeName, []);

      const axisProperty =
        axis != null ? this.getAxisPropertyName(axis.type) : null;
      if (axisProperty != null) {
        const axes = axisTypeMap.get(axis.type);
        if (axes) {
          const axisIndex = axes.indexOf(axis);
          const axisIndexString = axisIndex > 0 ? `${axisIndex + 1}` : '';
          seriesData[
            `${axisProperty}axis`
          ] = `${axisProperty}${axisIndexString}`;
        }
      }
    }
  }

  addStylingToSeriesData(
    seriesDataParam: Partial<PlotData>,
    plotStyle: DhType.plot.SeriesPlotStyle,
    lineColor: string | null = null,
    shapeColor: string | null = null,
    shape: string | null = null,
    shapeSize: number | null = null,
    seriesVisibility: 'legendonly' | boolean | null = null
  ): void {
    const { dh } = this;
    const seriesData = seriesDataParam;
    // Add some empty objects so we can fill them in later with details without checking for existence
    seriesData.marker = { line: {} }; // border line width on markers
    seriesData.line = {
      width: 1, // default line width for lines, should eventually be able to override
    };

    if (plotStyle === dh.plot.SeriesPlotStyle.AREA) {
      seriesData.fill = 'tozeroy';
    } else if (plotStyle === dh.plot.SeriesPlotStyle.STACKED_AREA) {
      seriesData.stackgroup = 'stack';
    } else if (plotStyle === dh.plot.SeriesPlotStyle.STEP) {
      seriesData.line.shape = 'hv'; // plot.ly horizontal then vertical step styling
    } else if (plotStyle === dh.plot.SeriesPlotStyle.HISTOGRAM) {
      // The default histfunc in plotly is 'count', but the data passed up from the API provides explicit x/y values and bins
      // Since it's converted to bar, just set the widths of each bar
      seriesData.width = [];
    } else if (plotStyle === dh.plot.SeriesPlotStyle.PIE) {
      seriesData.textinfo = 'label+percent';
    } else if (plotStyle === dh.plot.SeriesPlotStyle.TREEMAP) {
      seriesData.hoverinfo = 'text';
      seriesData.textinfo = 'label+text';
      (seriesData as TreeMapData).tiling = {
        packing: 'squarify',
        pad: 0,
      };
      seriesData.textposition = 'middle center';
    }

    if (lineColor != null) {
      if (plotStyle === dh.plot.SeriesPlotStyle.BAR) {
        seriesData.marker.color = lineColor;
      } else {
        seriesData.line.color = lineColor;
      }
    }

    if (shapeColor != null) {
      seriesData.marker.color = shapeColor;
    }

    if (shape != null && shape.length > 0) {
      try {
        seriesData.marker.symbol = ChartUtils.getMarkerSymbol(shape);
      } catch (e) {
        log.warn('Unable to handle shape', shape, ':', e);
      }
    }

    if (shapeSize != null) {
      seriesData.marker.size = shapeSize * ChartUtils.DEFAULT_MARKER_SIZE;
    }

    // Skipping pie charts
    // Pie slice visibility is configured in chart layout instead of series data
    if (seriesVisibility != null && plotStyle !== dh.plot.SeriesPlotStyle.PIE) {
      seriesData.visible = seriesVisibility;
    }
  }

  getChartType(
    plotStyle: DhType.plot.SeriesPlotStyle,
    isBusinessTime: boolean,
    allowWebGL = true
  ): PlotType | undefined {
    const { dh } = this;
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        // When reading data from the `Figure`, it already provides bins and values, so rather than using
        // plot.ly to calculate the bins and sum values, just convert it to a bar chart
        return 'bar';
      default:
        return this.getPlotlyChartType(plotStyle, isBusinessTime, allowWebGL);
    }
  }

  /**
   * Return the plotly axis property name
   * @param axisType The axis type to get the property name for
   */
  getAxisPropertyName(axisType: DhType.plot.AxisType): 'x' | 'y' | null {
    const { dh } = this;
    switch (axisType) {
      case dh.plot.AxisType.X:
        return 'x';
      case dh.plot.AxisType.Y:
        return 'y';
      default:
        return null;
    }
  }

  /**
   * Returns the plotly "side" value for the provided axis position
   * @param axisPosition The Iris AxisPosition of the axis
   */
  getAxisSide(
    axisPosition: DhType.plot.AxisPosition
  ): LayoutAxis['side'] | undefined {
    const { dh } = this;
    switch (axisPosition) {
      case dh.plot.AxisPosition.BOTTOM:
        return 'bottom';
      case dh.plot.AxisPosition.TOP:
        return 'top';
      case dh.plot.AxisPosition.LEFT:
        return 'left';
      case dh.plot.AxisPosition.RIGHT:
        return 'right';
      default:
        return undefined;
    }
  }

  /**
   * Update the layout with all the axes information for the provided figure
   * @param figure Figure to update the axes for
   * @param layoutParam Layout object to update in place
   * @param chartAxisRangeParser Function to retrieve the axis range parser
   * @param plotWidth Width of the plot in pixels
   * @param plotHeight Height of the plot in pixels
   */
  updateFigureAxes(
    layoutParam: Partial<Layout>,
    figure: DhType.plot.Figure,
    chartAxisRangeParser?: ChartAxisRangeParser,
    plotWidth = 0,
    plotHeight = 0
  ): void {
    const layout = layoutParam;
    const figureAxes = ChartUtils.getAllAxes(figure);
    for (let i = 0; i < figure.charts.length; i += 1) {
      const chart = figure.charts[i];
      const axisRangeParser = chartAxisRangeParser?.(chart);
      const bounds = this.getChartBounds(figure, chart, plotWidth, plotHeight);
      this.updateLayoutAxes(
        layout,
        chart.axes,
        figureAxes,
        plotWidth,
        plotHeight,
        bounds,
        axisRangeParser
      );
    }

    this.removeStaleAxes(layout, figureAxes);
  }

  getChartBounds(
    figure: DhType.plot.Figure,
    chart: DhType.plot.Chart,
    plotWidth: number,
    plotHeight: number
  ): ChartBounds {
    const { dh } = this;
    const { cols, rows } = figure;
    const { column, colspan, row, rowspan } = chart;

    const endColumn = column + colspan;
    const endRow = row + rowspan;
    const columnSize = 1 / cols;
    const rowSize = 1 / rows;
    const xMarginSize = ChartUtils.AXIS_SIZE_PX / plotWidth;
    const yMarginSize = ChartUtils.AXIS_SIZE_PX / plotHeight;

    const bounds: ChartBounds = {
      // Need to invert the row positioning so the first one defined shows up on top instead of the bottom, since coordinates start in bottom left
      bottom: (rows - endRow) * rowSize + (endRow < rows ? yMarginSize / 2 : 0),
      top: (rows - row) * rowSize - (row > 0 ? yMarginSize / 2 : 0),

      left: column * columnSize + (column > 0 ? xMarginSize / 2 : 0),
      right: endColumn * columnSize - (endColumn < cols ? xMarginSize / 2 : 0),
    };

    // Adjust the bounds based on where the legend is
    // For now, always assume the legend is shown on the right
    const axisPositionMap = ChartUtils.groupArray(chart.axes, 'position');
    const rightAxes = axisPositionMap.get(dh.plot.AxisPosition.RIGHT) ?? [];
    if (rightAxes.length > 0) {
      if (plotWidth > 0) {
        bounds.right -=
          (bounds.right - bounds.left) *
          Math.max(
            0,
            Math.min(
              ChartUtils.LEGEND_WIDTH_PX / plotWidth,
              ChartUtils.MAX_LEGEND_SIZE
            )
          );
      } else {
        bounds.right -=
          (bounds.right - bounds.left) * ChartUtils.DEFAULT_AXIS_SIZE;
      }
    }

    return bounds;
  }

  getPlotlyDateFormat(
    formatter: Formatter | null,
    columnType: string,
    formatPattern: string | undefined | null
  ): Partial<LayoutAxis> {
    const { dh } = this;
    const tickformat =
      formatPattern == null
        ? undefined
        : formatPattern
            .replace('%', '%%')
            .replace(/S{9}/g, '%9f')
            .replace(/S{8}/g, '%8f')
            .replace(/S{7}/g, '%7f')
            .replace(/S{6}/g, '%6f')
            .replace(/S{5}/g, '%5f')
            .replace(/S{4}/g, '%4f')
            .replace(/S{3}/g, '%3f')
            .replace(/S{2}/g, '%2f')
            .replace(/S{1}/g, '%1f')
            .replace(/y{4}/g, '%Y')
            .replace(/y{2}/g, '%y')
            .replace(/M{4}/g, '%B')
            .replace(/M{3}/g, '%b')
            .replace(/M{2}/g, '%m')
            .replace(/M{1}/g, '%-m')
            .replace(/E{4,}/g, '%A')
            .replace(/E{1,}/g, '%a')
            .replace(/d{2}/g, '%d')
            .replace(/([^%]|^)d{1}/g, '$1%-d')
            .replace(/H{2}/g, '%H')
            .replace(/h{2}/g, '%I')
            .replace(/h{1}/g, '%-I')
            .replace(/m{2}/g, '%M')
            .replace(/s{2}/g, '%S')
            .replace("'T'", 'T')
            .replace(' z', ''); // timezone added as suffix if necessary

    let ticksuffix;
    const dataFormatter = formatter?.getColumnTypeFormatter(columnType);
    if (
      dataFormatter != null &&
      isDateTimeColumnFormatter(dataFormatter) &&
      dataFormatter.dhTimeZone != null &&
      dataFormatter.showTimeZone
    ) {
      ticksuffix = dh.i18n.DateTimeFormat.format(
        ' z',
        new Date(),
        dataFormatter.dhTimeZone
      );
    }

    return {
      tickformat,
      ticksuffix,
      automargin: true,
    };
  }

  /**
   * Gets the plotly axis formatting information from the source passed in
   * @param source The Source to get the formatter information from
   * @param formatter The current formatter for formatting data
   */
  getPlotlyAxisFormat(
    source: DhType.plot.SeriesDataSource,
    formatter: Formatter | null = null
  ): Partial<PlotlyAxis> | null {
    const { dh } = this;
    const { axis, columnType } = source;
    const { formatPattern } = axis;

    let axisFormat = null;
    if (TableUtils.isDateType(columnType)) {
      axisFormat = this.getPlotlyDateFormat(
        formatter,
        columnType,
        formatPattern
      );
      axisFormat = ChartUtils.addTickSpacing(axisFormat, axis, true);
    } else if (TableUtils.isNumberType(columnType)) {
      axisFormat = ChartUtils.getPlotlyNumberFormat(
        formatter,
        columnType,
        formatPattern
      );
      axisFormat = ChartUtils.addTickSpacing(axisFormat, axis, false);
    }

    if (axis.formatType === dh.plot.AxisFormatType.CATEGORY) {
      if (axisFormat) {
        axisFormat.type = 'category';
      } else {
        axisFormat = {
          type: 'category' as PlotlyAxisType,
          tickformat: undefined,
          ticksuffix: undefined,
        };
      }
    }

    return axisFormat;
  }

  /**
   * Updates the axes positions and sizes in the layout object provided.
   * If the axis did not exist in the layout previously, it is created and added.
   * Any axis that no longer exists in axes is removed.
   * With Downsampling enabled, will also update the range on the axis itself as appropriate
   * @param layoutParam The layout object to update
   * @param chartAxes The chart axes to update the layout with
   * @param figureAxes All figure axes to update the layout with
   * @param plotWidth The width of the plot to calculate the axis sizes for
   * @param plotHeight The height of the plot to calculate the axis sizes for
   * @param bounds The bounds for this set of axes
   * @param axisRangeParser A function to retrieve the range parser for a given axis
   */
  updateLayoutAxes(
    layoutParam: Partial<Layout>,
    chartAxes: DhType.plot.Axis[],
    figureAxes: DhType.plot.Axis[],
    plotWidth = 0,
    plotHeight = 0,
    bounds: ChartBounds = { left: 0, top: 0, right: 1, bottom: 1 },
    axisRangeParser?: AxisRangeParser
  ): void {
    const { dh } = this;
    const xAxisSize =
      plotWidth > 0
        ? Math.max(
            ChartUtils.MIN_AXIS_SIZE,
            Math.min(
              ChartUtils.AXIS_SIZE_PX / plotHeight,
              ChartUtils.MAX_AXIS_SIZE
            )
          )
        : ChartUtils.DEFAULT_AXIS_SIZE;
    const yAxisSize =
      plotHeight > 0
        ? Math.max(
            ChartUtils.MIN_AXIS_SIZE,
            Math.min(
              ChartUtils.AXIS_SIZE_PX / plotWidth,
              ChartUtils.MAX_AXIS_SIZE
            )
          )
        : ChartUtils.DEFAULT_AXIS_SIZE;

    const layout = layoutParam;
    const axisPositionMap = ChartUtils.groupArray(chartAxes, 'position');
    const axisTypeMap = ChartUtils.groupArray(chartAxes, 'type');
    const axisTypes = [...axisTypeMap.keys()];
    const figureAxisTypeMap = ChartUtils.groupArray(figureAxes, 'type');
    for (let j = 0; j < axisTypes.length; j += 1) {
      const axisType = axisTypes[j];
      const axisProperty = this.getAxisPropertyName(axisType);
      if (axisProperty != null) {
        const typeAxes = axisTypeMap.get(axisType);
        const figureTypeAxes = figureAxisTypeMap.get(axisType);
        const isYAxis = axisType === dh.plot.AxisType.Y;
        const plotSize = isYAxis ? plotHeight : plotWidth;

        assertNotNull(typeAxes);
        assertNotNull(figureTypeAxes);
        for (
          let chartAxisIndex = 0;
          chartAxisIndex < typeAxes.length;
          chartAxisIndex += 1
        ) {
          const axis = typeAxes[chartAxisIndex];
          const figureAxisIndex = figureTypeAxes.indexOf(axis);
          const axisLayoutProperty = ChartUtils.getAxisLayoutProperty(
            axisProperty,
            figureAxisIndex
          );

          if (layout[axisLayoutProperty] == null) {
            layout[axisLayoutProperty] = {};
          }

          const layoutAxis = layout[axisLayoutProperty];
          if (layoutAxis != null) {
            this.updateLayoutAxis(
              layoutAxis,
              axis,
              chartAxisIndex,
              axisPositionMap,
              xAxisSize,
              yAxisSize,
              bounds
            );

            const { range, autorange } = layoutAxis;
            if (
              axisRangeParser != null &&
              range !== undefined &&
              (autorange === undefined || autorange === false)
            ) {
              const rangeParser = axisRangeParser(axis);
              const [rangeStart, rangeEnd] = rangeParser(range as Range);

              log.debug(
                'Setting downsample range',
                plotSize,
                rangeStart,
                rangeEnd
              );

              axis.range(plotSize, rangeStart, rangeEnd);
            } else {
              axis.range(plotSize);
            }
          }
        }
      }
    }
  }

  /**
   * Remove any axes from the layout param that no longer belong to any series
   * @param layoutParam Layout object to remove stale axes from
   * @param axes All axes in the figure
   */
  removeStaleAxes(
    layoutParam: Partial<Layout>,
    axes: DhType.plot.Axis[]
  ): void {
    const layout = layoutParam;
    const figureAxisTypeMap = ChartUtils.groupArray(axes, 'type');
    const figureAxisTypes = [...figureAxisTypeMap.keys()];
    for (let i = 0; i < figureAxisTypes.length; i += 1) {
      const axisType = figureAxisTypes[i];
      const typeAxes = figureAxisTypeMap.get(axisType);
      assertNotNull(typeAxes);
      let axisIndex = typeAxes.length;
      // Delete any axes that may no longer exist
      const axisProperty = this.getAxisPropertyName(axisType);
      if (axisProperty != null) {
        let axisLayoutProperty = ChartUtils.getAxisLayoutProperty(
          axisProperty,
          axisIndex
        );
        while (layout[axisLayoutProperty] != null) {
          delete layout[axisLayoutProperty];

          axisIndex += 1;
          axisLayoutProperty = ChartUtils.getAxisLayoutProperty(
            axisProperty,
            axisIndex
          );
        }
      }
    }
  }

  /**
   * Updates the layout axis object in place
   * @param layoutAxisParam The plotly layout axis param
   * @param axis The Iris Axis to update the plotly layout with
   * @param axisIndex The type index for this axis
   * @param axisPositionMap All the axes mapped by position
   * @param axisSize The size of each axis in percent
   * @param bounds The bounds of the axes domains
   */
  updateLayoutAxis(
    layoutAxisParam: Partial<LayoutAxis>,
    axis: DhType.plot.Axis,
    axisIndex: number,
    axisPositionMap: AxisPositionMap,
    xAxisSize: number,
    yAxisSize: number,
    bounds: {
      left: number;
      bottom: number;
      top: number;
      right: number;
    }
  ): void {
    const { dh } = this;
    const isYAxis = axis.type === dh.plot.AxisType.Y;
    const axisSize = isYAxis ? yAxisSize : xAxisSize;
    const layoutAxis = layoutAxisParam;
    // Enterprise API returns null for empty axis labels
    // Passing null title text to Plotly results in incorrect axis position, DH-9164
    const label = axis.label ?? '';
    if (
      layoutAxis.title !== undefined &&
      typeof layoutAxis.title !== 'string'
    ) {
      layoutAxis.title.text = label;
    } else {
      layoutAxis.title = { text: label };
    }

    if (axis.log) {
      layoutAxis.type = 'log';
    }

    layoutAxis.side = this.getAxisSide(axis.position);

    if (axisIndex > 0) {
      layoutAxis.overlaying = this.getAxisPropertyName(axis.type) ?? undefined;

      const positionAxes = axisPositionMap.get(axis.position) ?? [];
      const sideIndex = positionAxes.indexOf(axis);
      if (sideIndex > 0) {
        layoutAxis.anchor = 'free';

        if (axis.position === dh.plot.AxisPosition.RIGHT) {
          layoutAxis.position =
            bounds.right + (sideIndex - positionAxes.length + 1) * axisSize;
        } else if (axis.position === dh.plot.AxisPosition.TOP) {
          layoutAxis.position =
            bounds.top + (sideIndex - positionAxes.length + 1) * axisSize;
        } else if (axis.position === dh.plot.AxisPosition.BOTTOM) {
          layoutAxis.position =
            bounds.bottom + (positionAxes.length - sideIndex + 1) * axisSize;
        } else if (axis.position === dh.plot.AxisPosition.LEFT) {
          layoutAxis.position =
            bounds.left + (positionAxes.length - sideIndex + 1) * axisSize;
        }
      }
    } else if (axis.type === dh.plot.AxisType.X) {
      const leftAxes = axisPositionMap.get(dh.plot.AxisPosition.LEFT) || [];
      const rightAxes = axisPositionMap.get(dh.plot.AxisPosition.RIGHT) || [];
      const left = Math.max(
        bounds.left,
        bounds.left + (leftAxes.length - 1) * yAxisSize
      );
      const right = Math.min(
        bounds.right - (rightAxes.length - 1) * yAxisSize,
        bounds.right
      );
      layoutAxis.domain = [left, right];
    } else if (axis.type === dh.plot.AxisType.Y) {
      const bottomAxes = axisPositionMap.get(dh.plot.AxisPosition.BOTTOM) || [];
      const topAxes = axisPositionMap.get(dh.plot.AxisPosition.TOP) || [];
      const bottom = Math.max(
        bounds.bottom,
        bounds.bottom + (bottomAxes.length - 1) * xAxisSize
      );
      const top = Math.min(
        bounds.top - (topAxes.length - 1) * xAxisSize,
        bounds.top
      );
      layoutAxis.domain = [bottom, top];
    }
  }

  /**
   * Creates the bounds for the periods specified.
   * For example, if you pass in [['09:00', '17:00']], it will return [17, 9] (closing at 5pm, opening at 9am the next day)
   * If you pass [['09:00', '12:00'], ['13:00', '17:00']], it will return [12, 13] (closing at noon, opening at 1pm) and [17, 9] (closing at 5pm, opening at 9am the next day)
   * @param periods Periods to map
   * @param timeZoneDiff Time zone difference in hours
   * @returns Bounds for the periods in plotly format
   */
  // eslint-disable-next-line class-methods-use-this
  createBoundsFromPeriods(
    periods: DhType.calendar.BusinessPeriod[],
    timeZoneDiff = 0
  ): Range[] {
    if (periods.length === 0) {
      return [];
    }
    const numberPeriods = periods
      .map(period => [
        (ChartUtils.periodToDecimal(period.open) + timeZoneDiff) % 24,
        (ChartUtils.periodToDecimal(period.close) + timeZoneDiff) % 24,
      ])
      .sort((a, b) => a[0] - b[0]);

    const bounds: Range[] = [];
    for (let i = 0; i < numberPeriods.length; i += 1) {
      const period = numberPeriods[i];
      const nextPeriod = numberPeriods[(i + 1) % numberPeriods.length];
      bounds.push([period[1], nextPeriod[0]]);
    }
    return bounds;
  }

  /**
   * Creates range breaks for plotly from business periods.
   * @param periods Business periods to create the breaks for
   * @param timeZoneDiff Time zone difference in hours
   * @returns Plotly range breaks for the business periods
   */
  createBreaksFromPeriods(
    periods: DhType.calendar.BusinessPeriod[],
    timeZoneDiff = 0
  ): Rangebreaks[] {
    const bounds = this.createBoundsFromPeriods(periods, timeZoneDiff);
    return bounds.map(bound => ({
      pattern: 'hour',
      bounds: bound,
    }));
  }

  /**
   * Creates range break bounds for plotly from business days.
   * For example a standard business week of ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
   * will result in [[6,1]] meaning close on Saturday and open on Monday.
   * If you remove Wednesday from the array, then you get two closures [[6, 1], [3, 4]]
   *
   * @param businessDays the days to display on the x-axis
   */
  createBoundsFromDays(businessDays: string[]): Range[] {
    const weekLength = this.daysOfWeek.length;
    // No breaks if all days are business days
    if (businessDays.length === weekLength) {
      return [];
    }
    const businessDaysInt = businessDays.map(day =>
      this.daysOfWeek.indexOf(day)
    );
    const businessDaysSet = new Set(businessDaysInt);

    // These are the days when business is closed (e.g. Saturday to start the weekend)
    const closedDays = new Set<number>();
    for (let i = 0; i < weekLength; i += 1) {
      if (
        !businessDaysSet.has(i) &&
        businessDaysSet.has((i - 1 + weekLength) % weekLength)
      ) {
        closedDays.add(i);
      }
    }

    const boundsArray: Range[] = [];
    // For each close day, find the next open day
    closedDays.forEach(closedDay => {
      for (let i = 0; i < weekLength; i += 1) {
        const adjustedDay = (closedDay + i) % weekLength;
        if (businessDaysSet.has(adjustedDay)) {
          boundsArray.push([closedDay, adjustedDay]);
          return;
        }
      }
      throw new Error(
        `Unable to find open day for closed day ${closedDay}, businessDays: ${businessDays}`
      );
    });
    return boundsArray;
  }

  /**
   * Breaks in plotly for business days
   * @param businessDays Business days to create the breaks for
   * @returns Plotly range breaks for the business days
   */
  createBreaksFromDays(businessDays: string[]): Rangebreaks[] {
    const bounds = this.createBoundsFromDays(businessDays);
    return bounds.map(bound => ({
      pattern: 'day of week',
      bounds: bound,
    }));
  }

  /**
   * Creates range breaks for plotly from a business calendar.
   * @param businessCalendar Calendar to create the breaks from
   * @param formatter Formatter to use for time zones
   * @returns Plotly Rangebreaks for the business calendar
   */
  createRangeBreaksFromBusinessCalendar(
    businessCalendar: DhType.calendar.BusinessCalendar,
    formatter: Formatter
  ): Rangebreaks[] {
    const rangebreaks: Rangebreaks[] = [];
    const {
      businessPeriods,
      businessDays,
      holidays,
      timeZone: calendarTimeZone,
    } = businessCalendar;
    const typeFormatter =
      formatter?.getColumnTypeFormatter(BUSINESS_COLUMN_TYPE);
    let formatterTimeZone;
    if (isDateTimeColumnFormatter(typeFormatter)) {
      formatterTimeZone = typeFormatter.dhTimeZone;
    }
    const timeZoneDiff = ChartUtils.getTimeZoneDiff(
      calendarTimeZone,
      formatterTimeZone
    );
    if (holidays.length > 0) {
      rangebreaks.push(
        ...this.createRangeBreakValuesFromHolidays(
          holidays,
          calendarTimeZone,
          formatterTimeZone,
          businessCalendar
        )
      );
    }

    rangebreaks.push(
      ...this.createBreaksFromPeriods(businessPeriods, timeZoneDiff)
    );
    rangebreaks.push(...this.createBreaksFromDays(businessDays));

    return rangebreaks;
  }

  /**
   * Creates an array of range breaks for all holidays.
   *
   * @param holidays an array of holidays
   * @param calendarTimeZone the time zone for the business calendar
   * @param formatterTimeZone the time zone for the formatter
   * @param calendar the calendar the holidays are from
   */
  createRangeBreakValuesFromHolidays(
    holidays: DhType.calendar.Holiday[],
    calendarTimeZone: DhType.i18n.TimeZone,
    formatterTimeZone?: DhType.i18n.TimeZone,
    calendar?: DhType.calendar.BusinessCalendar
  ): Rangebreaks[] {
    const fullHolidays: string[] = [];
    const partialHolidays: {
      values: string[];
      dvalue: number;
    }[] = [];
    holidays.forEach(holiday => {
      if (holiday.businessPeriods.length > 0) {
        partialHolidays.push(
          ...this.createPartialHoliday(
            holiday,
            calendarTimeZone,
            formatterTimeZone,
            calendar
          )
        );
      } else {
        fullHolidays.push(
          this.createFullHoliday(holiday, calendarTimeZone, formatterTimeZone)
        );
      }
    });
    return [{ values: fullHolidays }, ...partialHolidays];
  }

  /**
   * Creates the range break value for a full holiday. A full holiday is day that has no business periods.
   *
   * @param holiday the full holiday
   * @param calendarTimeZone the time zone for the business calendar
   * @param formatterTimeZone the time zone for the formatter
   */
  createFullHoliday(
    holiday: DhType.calendar.Holiday,
    calendarTimeZone: DhType.i18n.TimeZone,
    formatterTimeZone?: DhType.i18n.TimeZone
  ): string {
    return this.adjustDateForTimeZone(
      `${holiday.date.toString()} 00:00:00.000000`,
      calendarTimeZone,
      formatterTimeZone
    );
  }

  /**
   * Creates the range break for a partial holiday. A partial holiday is holiday with business periods
   * that are different than the default business periods.
   *
   * @param holiday the partial holiday
   * @param calendarTimeZone the time zone for the business calendar
   * @param formatterTimeZone the time zone for the formatter
   * @param calendar the calendar the holiday is from. Used to check against the default business periods to ensure this holiday needs to be specified
   *
   * @returns an array of range breaks for the partial holiday
   */
  createPartialHoliday(
    holiday: DhType.calendar.Holiday,
    calendarTimeZone: DhType.i18n.TimeZone,
    formatterTimeZone?: DhType.i18n.TimeZone,
    calendar?: DhType.calendar.BusinessCalendar
  ): {
    values: string[];
    dvalue: number;
  }[] {
    if (holiday.businessPeriods.length === 0) {
      return [];
    }

    const dateString = holiday.date.toString();

    // First check that the holiday is on a business day. If it's not, we can ignore it
    if (calendar) {
      const dayOfWeek = new Date(dateString).getDay();
      const isBusinessDay = calendar.businessDays.includes(
        this.daysOfWeek[dayOfWeek]
      );
      if (!isBusinessDay) {
        return [];
      }
    }

    const closedPeriods = ChartUtils.createClosedRangesForPartialHoliday(
      holiday.businessPeriods,
      calendar?.businessPeriods ?? []
    );

    const rangeBreaks = [];
    for (let i = 0; i < closedPeriods.length; i += 1) {
      const [closeStart, closeEnd] = closedPeriods[i];
      // Skip over any periods where start and close are the same (zero hours)
      if (closeStart !== closeEnd) {
        const values = [
          this.adjustDateForTimeZone(
            `${dateString} ${ChartUtils.decimalToPeriod(closeStart)}:00.000000`,
            calendarTimeZone,
            formatterTimeZone
          ),
        ];
        const dvalue = MILLIS_PER_HOUR * (closeEnd - closeStart);
        rangeBreaks.push({ values, dvalue });
      }
    }
    return rangeBreaks;
  }

  /**
   * Adjusts a date string from the calendar time zone to the formatter time zone.
   *
   * @param dateString the date string
   * @param calendarTimeZone the time zone for the business calendar
   * @param formatterTimeZone the time zone for the formatter
   */
  adjustDateForTimeZone(
    dateString: string,
    calendarTimeZone: DhType.i18n.TimeZone,
    formatterTimeZone?: DhType.i18n.TimeZone
  ): string {
    if (
      formatterTimeZone &&
      formatterTimeZone.standardOffset !== calendarTimeZone.standardOffset
    ) {
      return this.unwrapValue(
        this.wrapValue(dateString, BUSINESS_COLUMN_TYPE, calendarTimeZone),
        formatterTimeZone
      ) as string;
    }
    return dateString;
  }

  /**
   * Creates the Figure settings from the Chart Builder settings
   * This should be deprecated at some point, and have Chart Builder create the figure settings directly.
   * This logic will still need to exist to translate existing charts, but could be part of a migration script
   * to translate the data.
   * Change when we decide to add more functionality to the Chart Builder.
   * @param settings The chart builder settings
   * @param settings.title The title for this figure
   * @param settings.xAxis The name of the column to use for the x-axis
   * @param settings.series The name of the columns to use for the series of this figure
   * @param settings.type The plot style for this figure
   */
  makeFigureSettings(
    settings: ChartModelSettings,
    table: DhType.Table
  ): {
    charts: {
      chartType: string;
      axes: { formatType: string; type: string; position: string }[];
      series: {
        plotStyle: string;
        name: string;
        dataSources: {
          type: string;
          columnName: string;
          axis: { formatType: string; type: string; position: string };
          table: DhType.Table;
        }[];
      }[];
    }[];
    title: string;
  } {
    const { dh } = this;
    const { series, xAxis: settingsAxis, type } = settings;
    const title = ChartUtils.titleFromSettings(settings);
    const xAxis = {
      formatType: `${dh.plot.AxisFormatType.NUMBER}`,
      type: `${dh.plot.AxisType.X}`,
      position: `${dh.plot.AxisPosition.BOTTOM}`,
    };
    const yAxis = {
      formatType: `${dh.plot.AxisFormatType.NUMBER}`,
      type: `${dh.plot.AxisType.Y}`,
      position: `${dh.plot.AxisPosition.LEFT}`,
    };

    return {
      charts: [
        {
          chartType: `${dh.plot.ChartType.XY}`,
          axes: [xAxis, yAxis],
          series: (series ?? []).map(name => ({
            plotStyle: `${type}`,
            name,
            dataSources: [
              {
                type: `${dh.plot.SourceType.X}`,
                columnName: settingsAxis ?? '',
                axis: xAxis,
                table,
              },
              {
                type: `${dh.plot.SourceType.Y}`,
                columnName: name,
                axis: yAxis,
                table,
              },
            ],
          })),
        },
      ],
      title,
    };
  }

  /**
   * Unwraps a value provided from API to a value plotly can understand
   * Eg. Unwraps DateWrapper, LongWrapper objects.
   */
  unwrapValue(value: unknown, timeZone?: DhType.i18n.TimeZone): unknown {
    const { dh } = this;
    if (value != null) {
      if (isDateWrapper(value)) {
        return dh.i18n.DateTimeFormat.format(
          ChartUtils.DATE_FORMAT,
          value,
          timeZone
        );
      }

      if (isLongWrapper(value)) {
        return value.asNumber();
      }
    }

    return value;
  }

  /**
   *
   * @param value The value to wrap up
   * @param columnType The type of column this value is from
   * @param timeZone The time zone if applicable
   */
  wrapValue(
    value: unknown,
    columnType: string,
    timeZone: DhType.i18n.TimeZone | null = null
  ): unknown {
    const { dh } = this;
    if (TableUtils.isDateType(columnType) && typeof value === 'string') {
      // Need to limit the format to the actual length of the string range set in plotly
      // Otherwise parse will fail
      const text = value;
      const format = ChartUtils.DATE_FORMAT.substr(0, value.length);
      const date = dh.i18n.DateTimeFormat.parse(format, text);
      if (!timeZone) {
        return date;
      }

      // IDS-5994 Due to date parsing, time zone, and daylight savings shenanigans, we need
      // to pass the actual offset with the time to have it parse correctly.
      // However, the offset can change based on the date because of Daylight Savings
      // So we end up parsing the date multiple times. And curse daylight savings.
      const tzFormat = `${format} Z`;
      const estimatedOffset = dh.i18n.DateTimeFormat.format(
        'Z',
        date,
        timeZone
      );
      const estimatedDate = dh.i18n.DateTimeFormat.parse(
        tzFormat,
        `${text} ${estimatedOffset}`
      );
      const offset = dh.i18n.DateTimeFormat.format(
        'Z',
        estimatedDate,
        timeZone
      );
      return dh.i18n.DateTimeFormat.parse(tzFormat, `${text} ${offset}`);
    }

    return value;
  }

  makeLayoutAxis(
    type: DhType.plot.AxisType | null,
    theme: Partial<ChartTheme>
  ): Partial<LayoutAxis> {
    const { dh } = this;
    const axis = {
      automargin: true,
      gridcolor: theme.gridcolor,
      linecolor: theme.linecolor,
      rangeslider: { visible: false },
      showline: true,
      ticks: 'outside' as const,
      ticklen: 5, // act as padding, can't find a tick padding
      tickcolor: theme.paper_bgcolor, // hide ticks as padding
      tickfont: {
        color: theme.zerolinecolor,
      },
      title: {
        font: {
          color: theme.title_color,
        },
      },
      legend: {
        font: {
          color: theme.legend_color,
        },
      },
    };

    if (type === dh.plot.AxisType.X) {
      Object.assign(axis, {
        showgrid: true,
      });
    } else if (type === dh.plot.AxisType.Y) {
      Object.assign(axis, {
        zerolinecolor: theme.zerolinecolor,
        zerolinewidth: 2,
      });
    }

    return axis;
  }

  /**
   * Creates a plotly layout template object based on a given theme.
   * See https://plotly.com/javascript/reference/layout/#layout-template
   * @param theme The theme to use for the layout template
   * @returns The layout template object
   */
  makeDefaultTemplate(theme: ChartTheme): Template {
    /* eslint-disable camelcase */
    const {
      error_band_line_color,
      ohlc_increasing,
      ohlc_decreasing,
      title_color,
    } = theme;

    return {
      data: {
        bar: [
          {
            marker: {
              line: { color: 'transparent' },
            },
          },
        ],
        scatter: [
          {
            error_x: { color: error_band_line_color } as ErrorBar,
            error_y: { color: error_band_line_color } as ErrorBar,
          },
        ],
        ohlc: [
          {
            increasing: { line: { color: ohlc_increasing } },
            decreasing: { line: { color: ohlc_decreasing } },
          },
        ],
        pie: [
          {
            outsidetextfont: {
              color: title_color,
            },
          },
        ],
        treemap: [
          {
            outsidetextfont: {
              color: title_color,
            },
          },
        ],
      },
      /* eslint-enable camelcase */
      layout: this.makeDefaultLayout(theme),
    };
  }

  /**
   * Creates a plotly layout object based on a given theme.
   * See https://plotly.com/javascript/reference/layout/
   * @param theme The theme to use for the layout
   */
  makeDefaultLayout(theme: ChartTheme): Partial<Layout> {
    const { dh } = this;

    const {
      /* Used as top level properties of `Layout` */
      /* eslint-disable camelcase */
      paper_bgcolor,
      plot_bgcolor,
      title_color,
      coastline_color,
      land_color,
      ocean_color,
      lake_color,
      river_color,
      /* eslint-disable camelcase */
    } = theme;

    const layout: Partial<Layout> = {
      paper_bgcolor,
      plot_bgcolor,
      autosize: true,
      colorway: ChartUtils.normalizeColorway(theme?.colorway),
      font: {
        family: "'Fira Sans', sans-serif",
        color: title_color,
      },
      title: {
        font: {
          color: title_color,
        },
        xanchor: 'center',
        xref: 'paper',
        yanchor: 'top',
        pad: { ...ChartUtils.DEFAULT_TITLE_PADDING },
        y: 1,
      },
      legend: {
        font: {
          color: title_color,
        },
      },
      margin: { ...ChartUtils.DEFAULT_MARGIN },
      xaxis: this.makeLayoutAxis(dh.plot.AxisType.X, theme),
      yaxis: this.makeLayoutAxis(dh.plot.AxisType.Y, theme),
      polar: {
        angularaxis: this.makeLayoutAxis(dh.plot.AxisType.SHAPE, theme),
        radialaxis: this.makeLayoutAxis(dh.plot.AxisType.SHAPE, theme),
        bgcolor: theme.plot_bgcolor,
      },
      scene: {
        xaxis: this.makeLayoutAxis(dh.plot.AxisType.X, theme),
        yaxis: this.makeLayoutAxis(dh.plot.AxisType.Y, theme),
        zaxis: this.makeLayoutAxis(null, theme),
      },
      geo: {
        showcoastlines: true,
        showframe: false,
        showland: true,
        showocean: true,
        showlakes: true,
        showrivers: true,
        bgcolor: paper_bgcolor,
        coastlinecolor: coastline_color,
        landcolor: land_color,
        oceancolor: ocean_color,
        lakecolor: lake_color,
        rivercolor: river_color,
      },
    };
    layout.datarevision = 0;

    return layout;
  }

  /**
   * Hydrate settings from a JSONable object
   * @param settings Dehydrated settings
   */
  hydrateSettings(
    settings: ChartModelSettings
  ): Omit<ChartModelSettings, 'type'> & { type?: DhType.plot.SeriesPlotStyle } {
    const { dh } = this;
    return {
      ...settings,
      type:
        settings.type != null
          ? dh.plot.SeriesPlotStyle[settings.type]
          : undefined,
    };
  }
}

export default ChartUtils;
