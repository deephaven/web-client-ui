import Log from '@deephaven/log';
import { TableUtils } from '@deephaven/jsapi-utils';
import dh from '@deephaven/jsapi-shim';

const log = Log.module('ChartUtils');

const DAYS = Object.freeze(dh.calendar.DayOfWeek.values());

const BUSINESS_COLUMN_TYPE = 'io.deephaven.time.DateTime';

const MILLIS_PER_HOUR = 3600000;

const NANOS_PER_MILLI = 1000000;

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
  });

  static DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSSSSS';

  static DEFAULT_MARGIN = Object.freeze({ l: 60, r: 50, t: 30, b: 60, pad: 0 });

  static DEFAULT_TITLE_PADDING = Object.freeze({ t: 8 });

  static SUBTITLE_LINE_HEIGHT = 25;

  /**
   * Converts the Iris plot style into a plotly chart type
   * @param {String} plotStyle The plotStyle to use, see dh.plot.SeriesPlotStyle
   * @param {boolean} isBusinessTime If the plot is using business time for an axis
   */
  static getPlotlyChartType(plotStyle, isBusinessTime) {
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

      case dh.plot.SeriesPlotStyle.HISTOGRAM:
        return 'histogram';

      case dh.plot.SeriesPlotStyle.OHLC:
        return 'ohlc';

      default:
        return null;
    }
  }

  /**
   * Converts the Iris plot style into a plotly chart mode
   * @param {String} plotStyle The plotStyle to use, see dh.plot.SeriesPlotStyle.*
   */
  static getPlotlyChartMode(plotStyle) {
    switch (plotStyle) {
      case dh.plot.SeriesPlotStyle.SCATTER:
        return 'markers';
      case dh.plot.SeriesPlotStyle.LINE:
        return 'lines';
      default:
        return null;
    }
  }

  /**
   * Get the property to set on the series data for plotly
   * @param {dh.plot.SeriesPlotStyle} plotStyle The plot style of the series
   * @param {dh.plot.SourceType} sourceType The source type for the series
   */
  static getPlotlyProperty(plotStyle, sourceType) {
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
      default:
        throw new Error('Unrecognized source type', sourceType);
    }
  }

  static getPlotlySeriesOrientation(series) {
    const { sources } = series;
    if (sources.length === 2 && sources[0].axis.type === dh.plot.AxisType.Y) {
      return ChartUtils.ORIENTATION.HORIZONTAL;
    }

    return ChartUtils.ORIENTATION.VERTICAL;
  }

  /**
   * Generate the plotly error bar data from the passed in data.
   * Iris passes in the values as absolute, plotly needs them as relative.
   * @param {Array[Number]} x The main data array
   * @param {Array[Number]} xLow The absolute low values
   * @param {Array[Number]} xHigh
   *
   * @returns {Object} The error_x object required by plotly, or null if none is required
   */
  static getPlotlyErrorBars(x, xLow, xHigh) {
    const array = xHigh.map((value, i) => value - x[i]);
    const arrayminus = xLow.map((value, i) => x[i] - value);
    return {
      type: 'data',
      symmetric: false,
      array,
      arrayminus,
    };
  }

  static getPlotlyDateFormat(formatter, columnType, formatPattern) {
    const tickformat =
      formatPattern == null
        ? null
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

    let ticksuffix = null;
    const dataFormatter = formatter.getColumnTypeFormatter(columnType);
    if (dataFormatter.dhTimeZone != null && dataFormatter.showTimeZone) {
      ticksuffix = dh.i18n.DateTimeFormat.format(
        ' z',
        new Date(),
        dataFormatter.dhTimeZone
      );
    }

    return { tickformat, ticksuffix, automargin: true };
  }

  static convertNumberPrefix(prefix) {
    return prefix.replace(/\u00A4\u00A4/g, 'USD').replace(/\u00A4/g, '$');
  }

  static getPlotlyNumberFormat(formatter, columnType, formatPattern) {
    if (!formatPattern) {
      return null;
    }

    // We translate java formatting: https://docs.oracle.com/javase/7/docs/api/java/text/DecimalFormat.html
    // Into d3 number formatting: https://github.com/d3/d3-format
    // We can't translate number formatting exactly, but should be able to translate the most common cases
    // First split it into the subpatterns; currently only handling the positive subpattern, ignoring the rest
    const subpatterns = formatPattern.split(';');
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
    ] = subpatterns[0].match(
      /^([^#,0.]*)([#,]*)([0,]*)(\.?)(0*)(#*)(E?0*)(%?)(.*)/
    );

    const paddingLength = zeroDigits.replace(',', '').length;
    const isCommaSeparated =
      placeholderDigits.indexOf(',') >= 0 || zeroDigits.indexOf(',') >= 0;
    const comma = isCommaSeparated ? ',' : '';
    const plotlyNumberType = numberType ? 'e' : 'f';
    const type = percentSign || plotlyNumberType;
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
   * @param {dh.plot.Source} source The Source to get the formatter information from
   * @param {Formatter} formatter The current formatter for formatting data
   */
  static getPlotlyAxisFormat(source, formatter = null) {
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
        axisFormat = { type: 'category', tickformat: null, ticksuffix: null };
      }
    }

    return axisFormat;
  }

  /**
   * Adds tick spacing for an axis that has gapBetweenMajorTicks defined.
   *
   * @param {object} axisFormat the current axis format, may be null
   * @param {object} axis the current axis
   * @param {boolean} isDateType indicates if the columns is a date type
   */
  static addTickSpacing(axisFormat, axis, isDateType) {
    const { gapBetweenMajorTicks } = axis;
    if (gapBetweenMajorTicks > 0) {
      const updatedFormat = axisFormat || {};
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
   * @param {dh.plot.Chart} chart The chart to get the source for
   * @param {dh.plot.Axis} axis The axis to find the source for
   * @returns {dh.plot.Source} The first source matching this axis
   */
  static getSourceForAxis(chart, axis) {
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
   * @param {string} name The series name to get the visibility for
   * @param {object} settings Chart settings
   * @returns {boolean|string} True for visible series and 'legendonly' for hidden
   */
  static getSeriesVisibility(name, settings) {
    if (settings?.hiddenSeries?.includes(name)) {
      return 'legendonly';
    }
    return true;
  }

  /**
   * Get hidden labels array from chart settings
   * @param {object} settings Chart settings
   * @returns {string[]} Array of hidden series names
   */
  static getHiddenLabels(settings) {
    if (settings?.hiddenSeries) {
      return [...settings.hiddenSeries];
    }
    return [];
  }

  /**
   * Create a default series data object. Apply styling to the object afterward.
   * @returns {Object} A simple series data object with no styling
   */
  static makeSeriesData(
    type,
    mode,
    name,
    orientation = ChartUtils.ORIENTATION.VERTICAL
  ) {
    return { type, mode, name, orientation };
  }

  /**
   * Create a data series (trace) for use with plotly
   * @param {dh.plot.Series} series The series to create the series data with
   * @param {Map<dh.plot.AxisType, dh.plot.Axis[]>} axisTypeMap The map of axes grouped by type
   * @param {boolean|string} seriesVisibility Visibility setting for the series
   * @param {Object} theme The theme properties for the plot. See ChartTheme.js for an example
   * @returns {Object} The series data (trace) object for use with plotly.
   */
  static makeSeriesDataFromSeries(
    series,
    axisTypeMap,
    seriesVisibility,
    theme
  ) {
    const { name, plotStyle, lineColor, shapeColor, sources } = series;

    const isBusinessTime = sources.some(source => source.axis.businessCalendar);
    const type = ChartUtils.getChartType(plotStyle, isBusinessTime);
    const mode = ChartUtils.getPlotlyChartMode(plotStyle);
    const orientation = ChartUtils.getPlotlySeriesOrientation(series);

    const seriesData = ChartUtils.makeSeriesData(type, mode, name, orientation);

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
    seriesDataParam,
    plotStyle,
    sources,
    axisTypeMap
  ) {
    const seriesData = seriesDataParam;
    for (let k = 0; k < sources.length; k += 1) {
      const source = sources[k];
      const { axis, type: sourceType } = source;

      const dataAttributeName = ChartUtils.getPlotlyProperty(
        plotStyle,
        sourceType
      );
      seriesData[dataAttributeName] = [];

      const axisProperty = ChartUtils.getAxisPropertyName(axis.type);
      const axes = axisTypeMap.get(axis.type);
      const axisIndex = axes.indexOf(axis);
      if (axisProperty != null) {
        const axisIndexString = axisIndex > 0 ? `${axisIndex + 1}` : '';
        seriesData[`${axisProperty}axis`] = `${axisProperty}${axisIndexString}`;
      }
    }
  }

  static addStylingToSeriesData(
    seriesDataParam,
    plotStyle,
    theme = {},
    lineColor = null,
    shapeColor = null,
    seriesVisibility = null
  ) {
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
      Object.assign(seriesData.marker.line, {
        color: theme.paper_bgcolor,
        width: 1,
      });
    } else if (plotStyle === dh.plot.SeriesPlotStyle.OHLC) {
      seriesData.increasing = {
        line: { color: theme.ohlc_increasing },
      };
      seriesData.decreasing = {
        line: { color: theme.ohlc_decreasing },
      };
    } else if (plotStyle === dh.plot.SeriesPlotStyle.PIE) {
      seriesData.textinfo = 'label+percent';
      seriesData.outsidetextfont = { color: theme.title_color };
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
   * @param {dh.plot.Figure} figure The figure to get the axis formats for
   * @param {Formatter} formatter The formatter to use when getting the axis format
   * @returns {Map<string, object>} A map of axis layout property names to axis formats
   */
  static getAxisFormats(figure, formatter) {
    const axisFormats = new Map();
    const nullFormat = { tickformat: null, ticksuffix: null };

    const { charts } = figure;

    for (let i = 0; i < charts.length; i += 1) {
      const chart = charts[i];
      const axisTypeMap = ChartUtils.groupArray(chart.axes, 'type');

      for (let j = 0; j < chart.series.length; j += 1) {
        const series = chart.series[j];
        const { sources } = series;

        for (let k = 0; k < sources.length; k += 1) {
          const source = sources[k];
          const { axis } = source;
          const { type: axisType } = axis;
          const typeAxes = axisTypeMap.get(axisType);
          const axisIndex = typeAxes.indexOf(axis);
          const axisProperty = ChartUtils.getAxisPropertyName(axisType);
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
              if (businessCalendar) {
                axisFormat.rangebreaks = [];
                const {
                  businessPeriods,
                  businessDays,
                  holidays,
                  timeZone: calendarTimeZone,
                } = businessCalendar;
                const formatterTimeZone = formatter?.getColumnTypeFormatter(
                  BUSINESS_COLUMN_TYPE
                )?.dhTimeZone;
                const timeZoneDiff = formatterTimeZone
                  ? (calendarTimeZone.standardOffset -
                      formatterTimeZone.standardOffset) /
                    60
                  : 0;
                if (holidays.length > 0) {
                  axisFormat.rangebreaks.push(
                    ...ChartUtils.createRangeBreakValuesFromHolidays(
                      holidays,
                      calendarTimeZone,
                      formatterTimeZone
                    )
                  );
                }
                businessPeriods.forEach(period =>
                  axisFormat.rangebreaks.push({
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
                      axisFormat.rangebreaks.push({
                        pattern: 'day of week',
                        bounds: weekendBounds,
                      })
                  );
                }
              }

              if (axisFormats.size === chart.axes.length) {
                return axisFormats;
              }
            }
          }
        }
      }
    }

    return axisFormats;
  }

  static getChartType(plotStyle, isBusinessTime) {
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
   * @param {dh.plot.AxisType} axisType The axis type to get the property name for
   */
  static getAxisPropertyName(axisType) {
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
   * @param {dh.plot.AxisPosition} axisPosition The Iris AxisPosition of the axis
   */
  static getAxisSide(axisPosition) {
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
        return null;
    }
  }

  /**
   * Retrieve the chart that contains the passed in series from the figure
   * @param {dh.plot.Figure} figure The figure to retrieve the chart from
   * @param {dh.plot.Series} series The series to get the chart for
   */
  static getChartForSeries(figure, series) {
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
   * @param {object} layout The plotly layout object to get the ranges from
   * @returns {object} An object mapping the axis name to it's range
   */
  static getLayoutRanges(layout) {
    const ranges = {};
    const keys = Object.keys(layout).filter(key => key.indexOf('axis') >= 0);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (layout[key] && layout[key].range && !layout[key].autorange) {
        // Only want to add the range if it's not autoranged
        ranges[key] = [...layout[key].range];
      }
    }

    return ranges;
  }

  /**
   * Updates the axes positions and sizes in the layout object provided.
   * If the axis did not exist in the layout previously, it is created and added.
   * Any axis that no longer exists in axes is removed.
   * With Downsampling enabled, will also update the range on the axis itself as appropriate
   * @param {object} layoutParam The layout object to update
   * @param {dh.plot.Axis[]} axes The axes to update the layout with
   * @param {number} plotWidth The width of the plot to calculate the axis sizes for
   * @param {number} plotHeight The height of the plot to calculate the axis sizes for
   * @param {func} getRangeParser A function to retrieve the range parser for a given axis
   */
  static updateLayoutAxes(
    layoutParam,
    axes,
    plotWidth = 0,
    plotHeight = 0,
    getRangeParser = null,
    theme = {}
  ) {
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

    // Adjust the bounds based on where the legend is
    // For now, always assume the legend is shown on the right
    const bounds = {
      left: 0,
      bottom: 0,
      top: 1,
      right: 1,
    };
    const axisPositionMap = ChartUtils.groupArray(axes, 'position');
    const rightAxes = axisPositionMap.get(dh.plot.AxisPosition.RIGHT) || [];
    if (rightAxes.length > 0) {
      if (plotWidth > 0) {
        bounds.right =
          1 -
          Math.max(
            0,
            Math.min(
              ChartUtils.LEGEND_WIDTH_PX / plotWidth,
              ChartUtils.MAX_LEGEND_SIZE
            )
          );
      } else {
        bounds.right = 1 - ChartUtils.DEFAULT_AXIS_SIZE;
      }
    }

    const layout = layoutParam;
    const axisTypeMap = ChartUtils.groupArray(axes, 'type');
    const axisTypes = [...axisTypeMap.keys()];
    for (let j = 0; j < axisTypes.length; j += 1) {
      const axisType = axisTypes[j];
      const axisProperty = ChartUtils.getAxisPropertyName(axisType);
      if (axisProperty != null) {
        const typeAxes = axisTypeMap.get(axisType);
        const isYAxis = axisType === dh.plot.AxisType.Y;
        const plotSize = isYAxis ? plotHeight : plotWidth;
        let axisIndex = 0;
        for (axisIndex = 0; axisIndex < typeAxes.length; axisIndex += 1) {
          const axis = typeAxes[axisIndex];
          const axisLayoutProperty = ChartUtils.getAxisLayoutProperty(
            axisProperty,
            axisIndex
          );
          if (layout[axisLayoutProperty] == null) {
            layout[axisLayoutProperty] = ChartUtils.makeLayoutAxis(
              axisType,
              theme
            );
          }

          const layoutAxis = layout[axisLayoutProperty];
          ChartUtils.updateLayoutAxis(
            layoutAxis,
            axis,
            axisIndex,
            axisPositionMap,
            xAxisSize,
            yAxisSize,
            bounds
          );
          const { range, autorange } = layoutAxis;
          if (getRangeParser && range && !autorange) {
            const rangeParser = getRangeParser(axis);
            const [rangeStart, rangeEnd] = rangeParser(range);

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

  static getAxisLayoutProperty(axisProperty, axisIndex) {
    const axisIndexString = axisIndex > 0 ? `${axisIndex + 1}` : '';
    return `${axisProperty}axis${axisIndexString}`;
  }

  /**
   * Updates the layout axis object in place
   * @param {object} layoutAxisParam The plotly layout axis param
   * @param {dh.plot.Axis} axis The Iris Axis to update the plotly layout with
   * @param {number} axisIndex The type index for this axis
   * @param {Map<dh.plot.AxisPosition, dh.plot.Axis>} axisPositionMap All the axes mapped by position
   * @param {number} axisSize The size of each axis in percent
   * @param {object} bounds The bounds of the axes domains
   */
  static updateLayoutAxis(
    layoutAxisParam,
    axis,
    axisIndex,
    axisPositionMap,
    xAxisSize,
    yAxisSize,
    bounds
  ) {
    const isYAxis = axis.type === dh.plot.AxisType.Y;
    const axisSize = isYAxis ? yAxisSize : xAxisSize;
    const layoutAxis = layoutAxisParam;
    layoutAxis.title.text = axis.label;
    if (axis.log) {
      layoutAxis.type = 'log';
    }
    layoutAxis.side = ChartUtils.getAxisSide(axis.position);
    if (axisIndex > 0) {
      layoutAxis.overlaying = ChartUtils.getAxisPropertyName(axis.type);

      const positionAxes = axisPositionMap.get(axis.position);
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
   * @param {String} period the open or close value of the period
   */
  static periodToDecimal(period) {
    const values = period.split(':');
    return Number(values[0]) + Number(values[1] / 60);
  }

  /**
   * Creates range break bounds for plotly from business days.
   * For example a standard business week of ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
   * will result in [[6,1]] meaning close on Saturday and open on Monday.
   * If you remove Wednesday from the array, then you get two closures [[6, 1], [3, 4]]
   *
   * @param {Array} businessDays the days to display on the x-axis
   */
  static createBoundsFromDays(businessDays) {
    const businessDaysInt = businessDays.map(day => DAYS.indexOf(day));
    const nonBusinessDaysInt = DAYS.filter(
      day => !businessDays.includes(day)
    ).map(day => DAYS.indexOf(day));
    // These are the days when business reopens (e.g. Monday after a weekend)
    const reopenDays = new Set();
    nonBusinessDaysInt.forEach(closed => {
      for (let i = closed + 1; i < closed + DAYS.length; i += 1) {
        const adjustedDay = i % DAYS.length;
        if (businessDaysInt.includes(adjustedDay)) {
          reopenDays.add(adjustedDay);
          break;
        }
      }
    });
    const boundsArray = [];
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
   * @param {Array} holidays an array of holidays
   * @param {TimeZone} calendarTimeZone the time zone for the business calendar
   * @param {TimeZone} formatterTimeZone the time zone for the formatter
   */
  static createRangeBreakValuesFromHolidays(
    holidays,
    calendarTimeZone,
    formatterTimeZone
  ) {
    const fullHolidays = [];
    const partialHolidays = [];
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
   * @param {Holiday} holiday the full holiday
   * @param {TimeZone} calendarTimeZone the time zone for the business calendar
   * @param {TimeZone} formatterTimeZone the time zone for the formatter
   */
  static createFullHoliday(holiday, calendarTimeZone, formatterTimeZone) {
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
   * @param {Holiday} holiday the partial holiday
   * @param {TimeZone} calendarTimeZone the time zone for the business calendar
   * @param {TimeZone} formatterTimeZone the time zone for the formatter
   */
  static createPartialHoliday(holiday, calendarTimeZone, formatterTimeZone) {
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
   * @param {string} dateString the date string
   * @param {TimeZone} calendarTimeZone the time zone for the business calendar
   * @param {TimeZone} formatterTimeZone the time zone for the formatter
   */
  static adjustDateForTimeZone(
    dateString,
    calendarTimeZone,
    formatterTimeZone
  ) {
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
      );
    }
    return dateString;
  }

  /**
   * Groups an array and returns a map
   * @param {object[]} array The object to group
   * @param {string} property The property name to group by
   * @returns {Map<object, object>} A map containing the items grouped by their values for the property
   */
  static groupArray(array, property) {
    return array.reduce((result, item) => {
      const key = item[property];
      const group = result.get(key) || [];
      group.push(item);
      result.set(key, group);
      return result;
    }, new Map());
  }

  /**
   * Update
   */
  static updateRanges() {}

  /**
   * Unwraps a value provided from API to a value plotly can understand
   * Eg. Unwraps DateWrapper, LongWrapper objects.
   */
  static unwrapValue(value, timeZone = null) {
    if (value != null) {
      if (value.asDate) {
        return dh.i18n.DateTimeFormat.format(
          ChartUtils.DATE_FORMAT,
          value,
          timeZone
        );
      }

      if (value.asNumber) {
        return value.asNumber();
      }
    }

    return value;
  }

  /**
   *
   * @param {any} value The value to wrap up
   * @param {string} columnType The type of column this value is from
   * @param {dh.i18n.TimeZone} timeZone The time zone if applicable
   */
  static wrapValue(value, columnType, timeZone = null) {
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

  static makeLayoutAxis(type, theme = {}) {
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
   * @param {ChartTheme} theme The theme to get colorway from
   * @returns {string[]} Colorway array for the theme
   */
  static getColorwayFromTheme(theme) {
    let colorway = [];
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

  static makeDefaultLayout(theme = {}) {
    const layout = {
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
   * @param {object} settings Dehydrated settings
   */
  static hydrateSettings(settings) {
    return {
      ...settings,
      type: dh.plot.SeriesPlotStyle[settings.type],
    };
  }

  static titleFromSettings(settings) {
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
   * @param {object} settings The chart builder settings
   * @param {string} settings.title The title for this figure
   * @param {string} settings.xAxis The name of the column to use for the x-axis
   * @param {string[]} settings.series The name of the columns to use for the series of this figure
   * @param {dh.plot.SeriesPlotStyle} settings.type The plot style for this figure
   */
  static makeFigureSettings(settings, table) {
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
