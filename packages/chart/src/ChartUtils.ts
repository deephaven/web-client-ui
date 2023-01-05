import Log from '@deephaven/log';
import {
  DateTimeColumnFormatter,
  Formatter,
  TableColumnFormatter,
  TableUtils,
} from '@deephaven/jsapi-utils';
import dh, {
  Axis,
  AxisPosition,
  AxisType,
  Chart,
  DateWrapper,
  Figure,
  Holiday,
  LongWrapper,
  Series,
  SeriesDataSource,
  SeriesPlotStyle,
  SourceType,
  TableTemplate,
  TimeZone,
} from '@deephaven/jsapi-shim';
import set from 'lodash.set';
import {
  Layout,
  PlotData,
  PlotType,
  Axis as PlotlyAxis,
  ErrorBar,
  LayoutAxis,
  AxisType as PlotlyAxisType,
  OhclData,
} from 'plotly.js';
import { assertNotNull, Range } from '@deephaven/utils';
import ChartTheme from './ChartTheme';

export interface ChartModelSettings {
  hiddenSeries?: string[];
  type: keyof SeriesPlotStyle;
  series: string[];
  xAxis: string;
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

export type AxisRangeParser = (axis: Axis) => RangeParser;

export type ChartAxisRangeParser = (chart: Chart) => AxisRangeParser;

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

export type AxisTypeMap = Map<AxisType, Axis[]>;
type AxisPositionMap = Map<AxisPosition, Axis[]>;

const log = Log.module('ChartUtils');

const DAYS = Object.freeze(dh.calendar.DayOfWeek.values());

const BUSINESS_COLUMN_TYPE = 'io.deephaven.time.DateTime';

const MILLIS_PER_HOUR = 3600000;

const NANOS_PER_MILLI = 1000000;

function isDateWrapper(value: unknown): value is DateWrapper {
  return (value as DateWrapper).asDate !== undefined;
}

function isLongWrapper(value: unknown): value is LongWrapper {
  return (value as LongWrapper).asNumber !== undefined;
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

  /**
   * Converts the Iris plot style into a plotly chart type
   * @param plotStyle The plotStyle to use, see dh.plot.SeriesPlotStyle
   * @param isBusinessTime If the plot is using business time for an axis
   */
  static getPlotlyChartType(
    plotStyle: SeriesPlotStyle,
    isBusinessTime: boolean
  ): PlotType | undefined {
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.SCATTER:
        // scattergl mode is more performant, but doesn't support the rangebreaks we need for businessTime calendars
        return !isBusinessTime ? 'scattergl' : 'scatter';
      case dh.plot.SeriesPlotStyle.LINE:
        // There is also still some artifacting bugs with scattergl: https://github.com/plotly/plotly.js/issues/3522
        // The artifacting only occurs on line plots, which we can draw with fairly decent performance using SVG paths
        // Once the above plotly issue is fixed, scattergl should be used here (when !isBusinessTime)
        return 'scatter';
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
   */
  static getPlotlyChartMode(
    plotStyle: SeriesPlotStyle
  ): PlotData['mode'] | undefined {
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.SCATTER:
        return 'markers';
      case dh.plot.SeriesPlotStyle.LINE:
        return 'lines';
      default:
        return undefined;
    }
  }

  /**
   * Get the property to set on the series data for plotly
   * @param plotStyle The plot style of the series
   * @param sourceType The source type for the series
   */
  static getPlotlyProperty(
    plotStyle: SeriesPlotStyle,
    sourceType: SourceType
  ): string {
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

  static getPlotlySeriesOrientation(series: Series): 'h' | 'v' | undefined {
    const { sources } = series;
    if (sources.length === 2 && sources[0]?.axis?.type === dh.plot.AxisType.Y) {
      return ChartUtils.ORIENTATION.HORIZONTAL;
    }

    return ChartUtils.ORIENTATION.VERTICAL;
  }

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

  static getPlotlyDateFormat(
    formatter: Formatter | null,
    columnType: string,
    formatPattern: string
  ): Partial<LayoutAxis> {
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

  static convertNumberPrefix(prefix: string): string {
    return prefix.replace(/\u00A4\u00A4/g, 'USD').replace(/\u00A4/g, '$');
  }

  static getPlotlyNumberFormat(
    formatter: Formatter | null,
    columnType: string,
    formatPattern: string
  ): Partial<LayoutAxis> | null {
    if (!formatPattern) {
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
   * Gets the plotly axis formatting information from the source passed in
   * @param source The Source to get the formatter information from
   * @param formatter The current formatter for formatting data
   */
  static getPlotlyAxisFormat(
    source: SeriesDataSource,
    formatter: Formatter | null = null
  ): Partial<PlotlyAxis> | null {
    const { axis, columnType } = source;
    const { formatPattern } = axis;

    let axisFormat = null;
    if (TableUtils.isDateType(columnType)) {
      axisFormat = ChartUtils.getPlotlyDateFormat(
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
   * Adds tick spacing for an axis that has gapBetweenMajorTicks defined.
   *
   * @param axisFormat the current axis format, may be null
   * @param axis the current axis
   * @param isDateType indicates if the columns is a date type
   */
  static addTickSpacing(
    axisFormat: Partial<LayoutAxis> | null,
    axis: Axis,
    isDateType: boolean
  ): Partial<PlotlyAxis> | null {
    const { gapBetweenMajorTicks } = axis;
    if (gapBetweenMajorTicks > 0) {
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
  static getSourceForAxis(chart: Chart, axis: Axis): SeriesDataSource | null {
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
   * Create a data series (trace) for use with plotly
   * @param series The series to create the series data with
   * @param axisTypeMap The map of axes grouped by type
   * @param seriesVisibility Visibility setting for the series
   * @param theme The theme properties for the plot. See ChartTheme.js for an example
   * @returns The series data (trace) object for use with plotly.
   */
  static makeSeriesDataFromSeries(
    series: Series,
    axisTypeMap: AxisTypeMap,
    seriesVisibility: boolean | 'legendonly',
    showLegend: boolean | null = null,
    theme = ChartTheme
  ): Partial<PlotData> {
    const { name, plotStyle, lineColor, shapeColor, sources } = series;

    const isBusinessTime = sources.some(
      source => source.axis?.businessCalendar
    );
    const type = ChartUtils.getChartType(plotStyle, isBusinessTime);
    const mode = ChartUtils.getPlotlyChartMode(plotStyle);
    const orientation = ChartUtils.getPlotlySeriesOrientation(series);
    const seriesData = ChartUtils.makeSeriesData(
      type,
      mode,
      name,
      showLegend,
      orientation
    );

    ChartUtils.addSourcesToSeriesData(
      seriesData,
      plotStyle,
      sources,
      axisTypeMap
    );

    ChartUtils.addStylingToSeriesData(
      seriesData,
      plotStyle,
      theme,
      lineColor,
      shapeColor,
      seriesVisibility
    );

    return seriesData;
  }

  static addSourcesToSeriesData(
    seriesDataParam: Partial<PlotData>,
    plotStyle: SeriesPlotStyle,
    sources: SeriesDataSource[],
    axisTypeMap: AxisTypeMap
  ): void {
    const seriesData = seriesDataParam;
    for (let k = 0; k < sources.length; k += 1) {
      const source = sources[k];
      const { axis, type: sourceType } = source;

      const dataAttributeName = ChartUtils.getPlotlyProperty(
        plotStyle,
        sourceType
      );
      set(seriesData, dataAttributeName, []);

      const axisProperty =
        axis != null ? ChartUtils.getAxisPropertyName(axis.type) : null;
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

  static addStylingToSeriesData(
    seriesDataParam: Partial<PlotData>,
    plotStyle: SeriesPlotStyle,
    theme: typeof ChartTheme = ChartTheme,
    lineColor: string | null = null,
    shapeColor: string | null = null,
    seriesVisibility: 'legendonly' | boolean | null = null
  ): void {
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

      if (seriesData.marker.line !== undefined) {
        Object.assign(seriesData.marker.line, {
          color: theme.paper_bgcolor,
          width: 1,
        });
      }
    } else if (plotStyle === dh.plot.SeriesPlotStyle.OHLC) {
      (seriesData as Partial<OhclData>).increasing = {
        line: { color: theme.ohlc_increasing },
      };
      (seriesData as Partial<OhclData>).decreasing = {
        line: { color: theme.ohlc_decreasing },
      };
    } else if (plotStyle === dh.plot.SeriesPlotStyle.PIE) {
      seriesData.textinfo = 'label+percent';

      // TODO Open DefinitelyTyped/Plotly PR to mark family and size as optional
      // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/plotly.js/lib/traces/pie.d.ts#L6
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (seriesData as any).outsidetextfont = {
        color: theme.title_color,
      };
    } else if (plotStyle === dh.plot.SeriesPlotStyle.TREEMAP) {
      seriesData.hoverinfo = 'text';
      seriesData.textinfo = 'label+text';
      (seriesData as TreeMapData).tiling = {
        packing: 'squarify',
        pad: 0,
      };
      seriesData.textposition = 'middle center';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (seriesData as any).outsidetextfont = { color: theme.title_color };
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

    // Skipping pie charts
    // Pie slice visibility is configured in chart layout instead of series data
    if (seriesVisibility != null && plotStyle !== dh.plot.SeriesPlotStyle.PIE) {
      seriesData.visible = seriesVisibility;
    }
  }

  /**
   * Retrieve the axis formats from the provided figure.
   * Currently defaults to just the x/y axes.
   * @param figure The figure to get the axis formats for
   * @param formatter The formatter to use when getting the axis format
   * @returns A map of axis layout property names to axis formats
   */
  static getAxisFormats(
    figure: Figure,
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
          const axisProperty = ChartUtils.getAxisPropertyName(axisType);
          if (axisProperty != null) {
            const axisLayoutProperty = ChartUtils.getAxisLayoutProperty(
              axisProperty,
              axisIndex
            );

            if (axisFormats.has(axisLayoutProperty)) {
              log.debug(`${axisLayoutProperty} already added.`);
            } else {
              log.debug(`Adding ${axisLayoutProperty} to axisFormats.`);
              const axisFormat = ChartUtils.getPlotlyAxisFormat(
                source,
                formatter
              );
              if (axisFormat === null) {
                axisFormats.set(axisLayoutProperty, nullFormat);
              } else {
                axisFormats.set(axisLayoutProperty, axisFormat);

                const { businessCalendar } = axis;
                if (businessCalendar != null) {
                  const rangebreaks: Rangebreaks[] = [];
                  const {
                    businessPeriods,
                    businessDays,
                    holidays,
                    timeZone: calendarTimeZone,
                  } = businessCalendar;
                  const typeFormatter = formatter?.getColumnTypeFormatter(
                    BUSINESS_COLUMN_TYPE
                  );
                  let formatterTimeZone;
                  if (isDateTimeColumnFormatter(typeFormatter)) {
                    formatterTimeZone = typeFormatter.dhTimeZone;
                  }
                  const timeZoneDiff = formatterTimeZone
                    ? (calendarTimeZone.standardOffset -
                        formatterTimeZone.standardOffset) /
                      60
                    : 0;
                  if (holidays.length > 0) {
                    rangebreaks.push(
                      ...ChartUtils.createRangeBreakValuesFromHolidays(
                        holidays,
                        calendarTimeZone,
                        formatterTimeZone
                      )
                    );
                  }
                  businessPeriods.forEach(period =>
                    rangebreaks.push({
                      pattern: 'hour',
                      bounds: [
                        ChartUtils.periodToDecimal(period.close) + timeZoneDiff,
                        ChartUtils.periodToDecimal(period.open) + timeZoneDiff,
                      ],
                    })
                  );
                  // If there are seven business days, then there is no weekend
                  if (businessDays.length < DAYS.length) {
                    ChartUtils.createBoundsFromDays(businessDays).forEach(
                      weekendBounds =>
                        rangebreaks.push({
                          pattern: 'day of week',
                          bounds: weekendBounds,
                        })
                    );
                  }

                  (axisFormat as RangebreakAxisFormat).rangebreaks = rangebreaks;
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

  static getChartType(
    plotStyle: SeriesPlotStyle,
    isBusinessTime: boolean
  ): PlotType | undefined {
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        // When reading data from the `Figure`, it already provides bins and values, so rather than using
        // plot.ly to calculate the bins and sum values, just convert it to a bar chart
        return 'bar';
      default:
        return ChartUtils.getPlotlyChartType(plotStyle, isBusinessTime);
    }
  }

  /**
   * Return the plotly axis property name
   * @param axisType The axis type to get the property name for
   */
  static getAxisPropertyName(axisType: AxisType): 'x' | 'y' | null {
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
  static getAxisSide(
    axisPosition: AxisPosition
  ): LayoutAxis['side'] | undefined {
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
   * Get all axes for a given `Figure`. Iterates through all charts axes and concatenates them.
   * @param figure Figure to get all axes for
   */
  static getAllAxes(figure: Figure): Axis[] {
    return figure.charts.reduce(
      (axes, chart) => [...axes, ...chart.axes],
      [] as Axis[]
    );
  }

  /**
   * Retrieve the chart that contains the passed in series from the figure
   * @param figure The figure to retrieve the chart from
   * @param series The series to get the chart for
   */
  static getChartForSeries(figure: Figure, series: Series): Chart | null {
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
  static getLayoutRanges(layout: Layout): Record<string, Range[]> {
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

  /**
   * Update the layout with all the axes information for the provided figure
   * @param figure Figure to update the axes for
   * @param layoutParam Layout object to update in place
   * @param chartAxisRangeParser Function to retrieve the axis range parser
   * @param plotWidth Width of the plot in pixels
   * @param plotHeight Height of the plot in pixels
   * @param theme Theme used for displaying the plot
   */
  static updateFigureAxes(
    layoutParam: Partial<Layout>,
    figure: Figure,
    chartAxisRangeParser?: ChartAxisRangeParser,
    plotWidth = 0,
    plotHeight = 0,
    theme = ChartTheme
  ): void {
    const layout = layoutParam;
    const figureAxes = ChartUtils.getAllAxes(figure);
    for (let i = 0; i < figure.charts.length; i += 1) {
      const chart = figure.charts[i];
      const axisRangeParser = chartAxisRangeParser?.(chart);
      const bounds = ChartUtils.getChartBounds(
        figure,
        chart,
        plotWidth,
        plotHeight
      );
      ChartUtils.updateLayoutAxes(
        layout,
        chart.axes,
        figureAxes,
        plotWidth,
        plotHeight,
        bounds,
        axisRangeParser,
        theme
      );
    }

    ChartUtils.removeStaleAxes(layout, figureAxes);
  }

  static getChartBounds(
    figure: Figure,
    chart: Chart,
    plotWidth = 0,
    plotHeight = 0
  ): ChartBounds {
    const { cols, rows } = figure;
    const { column, colspan, row, rowspan } = chart;

    const endColumn = column + colspan;
    const endRow = row + rowspan;
    const columnSize = 1 / cols;
    const rowSize = 1 / rows;
    const xMarginSize = ChartUtils.AXIS_SIZE_PX / plotWidth;
    const yMarginSize = ChartUtils.AXIS_SIZE_PX / plotHeight;

    const bounds: ChartBounds = {
      left: column * columnSize + (column > 0 ? xMarginSize / 2 : 0),
      bottom: row * rowSize + (row > 0 ? yMarginSize / 2 : 0),
      top: endRow * rowSize - (endRow < rows ? yMarginSize / 2 : 0),
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
  static updateLayoutAxes(
    layoutParam: Partial<Layout>,
    chartAxes: Axis[],
    figureAxes: Axis[],
    plotWidth = 0,
    plotHeight = 0,
    bounds: ChartBounds = { left: 0, top: 0, right: 1, bottom: 1 },
    axisRangeParser?: AxisRangeParser,
    theme = ChartTheme
  ): void {
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
      const axisProperty = ChartUtils.getAxisPropertyName(axisType);
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
            layout[axisLayoutProperty] = ChartUtils.makeLayoutAxis(
              axisType,
              theme
            );
          }

          const layoutAxis = layout[axisLayoutProperty];
          if (layoutAxis != null) {
            ChartUtils.updateLayoutAxis(
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
  static removeStaleAxes(layoutParam: Partial<Layout>, axes: Axis[]): void {
    const layout = layoutParam;
    const figureAxisTypeMap = ChartUtils.groupArray(axes, 'type');
    const figureAxisTypes = [...figureAxisTypeMap.keys()];
    for (let i = 0; i < figureAxisTypes.length; i += 1) {
      const axisType = figureAxisTypes[i];
      const typeAxes = figureAxisTypeMap.get(axisType);
      assertNotNull(typeAxes);
      let axisIndex = typeAxes.length;
      // Delete any axes that may no longer exist
      const axisProperty = ChartUtils.getAxisPropertyName(axisType);
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

  static getAxisLayoutProperty(
    axisProperty: 'x' | 'y',
    axisIndex: number
  ): LayoutAxisKey {
    const axisIndexString = axisIndex > 0 ? `${axisIndex + 1}` : '';
    return `${axisProperty ?? ''}axis${axisIndexString}` as LayoutAxisKey;
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
  static updateLayoutAxis(
    layoutAxisParam: Partial<LayoutAxis>,
    axis: Axis,
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

    layoutAxis.side = ChartUtils.getAxisSide(axis.position);

    if (axisIndex > 0) {
      layoutAxis.overlaying =
        ChartUtils.getAxisPropertyName(axis.type) ?? undefined;

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
   * Converts an open or close period to a declimal. e.g '09:30" to 9.5
   *
   * @param period the open or close value of the period
   */
  static periodToDecimal(period: string): number {
    const values = period.split(':');
    return Number(values[0]) + Number(values[1]) / 60;
  }

  /**
   * Creates range break bounds for plotly from business days.
   * For example a standard business week of ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
   * will result in [[6,1]] meaning close on Saturday and open on Monday.
   * If you remove Wednesday from the array, then you get two closures [[6, 1], [3, 4]]
   *
   * @param businessDays the days to display on the x-axis
   */
  static createBoundsFromDays(businessDays: string[]): Range[] {
    const businessDaysInt = businessDays.map(day => DAYS.indexOf(day));
    const nonBusinessDaysInt = DAYS.filter(
      day => !businessDays.includes(day)
    ).map(day => DAYS.indexOf(day));
    // These are the days when business reopens (e.g. Monday after a weekend)
    const reopenDays = new Set<number>();
    nonBusinessDaysInt.forEach(closed => {
      for (let i = closed + 1; i < closed + DAYS.length; i += 1) {
        const adjustedDay = i % DAYS.length;
        if (businessDaysInt.includes(adjustedDay)) {
          reopenDays.add(adjustedDay);
          break;
        }
      }
    });
    const boundsArray: Range[] = [];
    // For each reopen day, find the furthest previous closed day
    reopenDays.forEach(open => {
      for (let i = open - 1; i > open - DAYS.length; i -= 1) {
        const adjustedDay = i < 0 ? i + DAYS.length : i;
        if (businessDaysInt.includes(adjustedDay)) {
          const closedDay = (adjustedDay + 1) % 7;
          boundsArray.push([closedDay, open]);
          break;
        }
      }
    });
    return boundsArray;
  }

  /**
   * Creates an array of range breaks for all holidays.
   *
   * @param holidays an array of holidays
   * @param calendarTimeZone the time zone for the business calendar
   * @param formatterTimeZone the time zone for the formatter
   */
  static createRangeBreakValuesFromHolidays(
    holidays: Holiday[],
    calendarTimeZone: TimeZone,
    formatterTimeZone?: TimeZone
  ): Rangebreaks[] {
    const fullHolidays: string[] = [];
    const partialHolidays: {
      values: string[];
      dvalue: number;
    }[] = [];
    holidays.forEach(holiday => {
      if (holiday.businessPeriods.length > 0) {
        partialHolidays.push(
          ...ChartUtils.createPartialHoliday(
            holiday,
            calendarTimeZone,
            formatterTimeZone
          )
        );
      } else {
        fullHolidays.push(
          ChartUtils.createFullHoliday(
            holiday,
            calendarTimeZone,
            formatterTimeZone
          )
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
  static createFullHoliday(
    holiday: Holiday,
    calendarTimeZone: TimeZone,
    formatterTimeZone?: TimeZone
  ): string {
    return ChartUtils.adjustDateForTimeZone(
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
   */
  static createPartialHoliday(
    holiday: Holiday,
    calendarTimeZone: TimeZone,
    formatterTimeZone?: TimeZone
  ): {
    values: string[];
    dvalue: number;
  }[] {
    // If a holiday has business periods {open1, close1} and {open2, close2}
    // This will generate range breaks for:
    // closed from 00:00 to open1
    // closed from close1 to open2
    // closed from close2 to 23:59:59.999999
    const dateString = holiday.date.toString();
    const closedPeriods = ['00:00'];
    holiday.businessPeriods.forEach(period => {
      closedPeriods.push(period.open);
      closedPeriods.push(period.close);
    });
    // To go up to 23:59:59.999999, we calculate the dvalue using 24 - close
    closedPeriods.push('24:00');

    const rangeBreaks = [];
    for (let i = 0; i < closedPeriods.length; i += 2) {
      const startClose = closedPeriods[i];
      const endClose = closedPeriods[i + 1];
      // Skip over any periods where start and close are the same (zero hours)
      if (startClose !== endClose) {
        const values = [
          ChartUtils.adjustDateForTimeZone(
            `${dateString} ${startClose}:00.000000`,
            calendarTimeZone,
            formatterTimeZone
          ),
        ];
        const dvalue =
          MILLIS_PER_HOUR *
          (ChartUtils.periodToDecimal(endClose) -
            ChartUtils.periodToDecimal(startClose));
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
  static adjustDateForTimeZone(
    dateString: string,
    calendarTimeZone: TimeZone,
    formatterTimeZone?: TimeZone
  ): string {
    if (
      formatterTimeZone &&
      formatterTimeZone.standardOffset !== calendarTimeZone.standardOffset
    ) {
      return ChartUtils.unwrapValue(
        ChartUtils.wrapValue(
          dateString,
          BUSINESS_COLUMN_TYPE,
          calendarTimeZone
        ),
        formatterTimeZone
      ) as string;
    }
    return dateString;
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
   * Unwraps a value provided from API to a value plotly can understand
   * Eg. Unwraps DateWrapper, LongWrapper objects.
   */
  static unwrapValue(value: unknown, timeZone?: TimeZone): unknown {
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
  static wrapValue(
    value: unknown,
    columnType: string,
    timeZone: TimeZone | null = null
  ): unknown {
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

  static makeLayoutAxis(
    type: AxisType,
    theme = ChartTheme
  ): Partial<LayoutAxis> {
    const axis = {
      automargin: true,
      gridcolor: theme.gridcolor,
      linecolor: theme.linecolor,
      rangeslider: { visible: false },
      showline: true,
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
   * Parses the colorway property of a theme and returns an array of colors
   * Theme could have a single string with space separated colors or an array of strings representing the colorway
   * @param theme The theme to get colorway from
   * @returns Colorway array for the theme
   */
  static getColorwayFromTheme(theme = ChartTheme): string[] {
    let colorway: string[] = [];
    if (theme.colorway) {
      if (Array.isArray(theme.colorway)) {
        colorway = theme.colorway;
      } else if (typeof theme.colorway === 'string') {
        colorway = theme.colorway.split(' ');
      } else {
        log.warn(`Unable to handle colorway property: ${theme.colorway}`);
      }
    }

    return colorway;
  }

  static makeDefaultLayout(theme = ChartTheme): Partial<Layout> {
    const layout: Partial<Layout> = {
      ...theme,
      autosize: true,
      colorway: ChartUtils.getColorwayFromTheme(theme),
      font: {
        family: "'Fira Sans', sans-serif",
      },
      title: {
        font: {
          color: theme.title_color,
        },
        yanchor: 'top',
        pad: { ...ChartUtils.DEFAULT_TITLE_PADDING },
        y: 1,
      },
      legend: {
        font: {
          color: theme.title_color,
        },
      },
      margin: { ...ChartUtils.DEFAULT_MARGIN },
      xaxis: ChartUtils.makeLayoutAxis(dh.plot.AxisType.X, theme),
      yaxis: ChartUtils.makeLayoutAxis(dh.plot.AxisType.Y, theme),
    };
    layout.datarevision = 0;
    return layout;
  }

  /**
   * Hydrate settings from a JSONable object
   * @param settings Dehydrated settings
   */
  static hydrateSettings(
    settings: ChartModelSettings
  ): Omit<ChartModelSettings, 'type'> & { type: SeriesPlotStyle } {
    return {
      ...settings,
      type: dh.plot.SeriesPlotStyle[settings.type],
    };
  }

  static titleFromSettings(settings: ChartModelSettings): string {
    const {
      series,
      xAxis,
      title = `${series.join(', ')} by ${xAxis}`,
    } = settings;

    return title;
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
  static makeFigureSettings(
    settings: ChartModelSettings,
    table: TableTemplate
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
          table: TableTemplate;
        }[];
      }[];
    }[];
    title: string;
  } {
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
          series: series.map(name => ({
            plotStyle: `${type}`,
            name,
            dataSources: [
              {
                type: `${dh.plot.SourceType.X}`,
                columnName: settingsAxis,
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
}

export default ChartUtils;
