import {
  getExpressionRanges,
  resolveCssVariablesInRecord,
} from '@deephaven/components';
import Log from '@deephaven/log';
import { ColorUtils } from '@deephaven/utils';
import chartThemeRaw from './ChartTheme.module.scss';

const log = Log.module('ChartTheme');

export interface ChartTheme {
  paper_bgcolor: string;
  plot_bgcolor: string;
  title_color: string;
  legend_color: string;
  colorway: string;
  gridcolor: string;
  linecolor: string;
  zerolinecolor: string;

  error_band_line_color: string;
  ohlc_increasing: string;
  ohlc_decreasing: string;

  // Geo
  coastline_color: string;
  land_color: string;
  ocean_color: string;
  lake_color: string;
  river_color: string;

  // Indicator
  indicator_increasing: string;
  indicator_decreasing: string;
  indicator_gauge: string;
}

export function defaultChartTheme(): Readonly<ChartTheme> {
  const chartTheme = resolveCssVariablesInRecord(chartThemeRaw);

  // The color normalization in `resolveCssVariablesInRecord` won't work for
  // colorway since it is an array of colors. We need to explicitly normalize
  // each color expression
  chartTheme.colorway = getExpressionRanges(chartTheme.colorway ?? '')
    .map(([start, end]) =>
      ColorUtils.normalizeCssColor(
        chartTheme.colorway.substring(start, end + 1)
      )
    )
    .join(' ');

  log.debug2('Chart theme:', chartThemeRaw);
  log.debug2('Chart theme derived:', chartTheme);

  return Object.freeze({
    paper_bgcolor: chartTheme['paper-bgcolor'],
    plot_bgcolor: chartTheme['plot-bgcolor'],
    title_color: chartTheme['title-color'],
    legend_color: chartTheme['legend-color'],
    colorway: chartTheme.colorway,
    gridcolor: chartTheme.gridcolor,
    linecolor: chartTheme.linecolor,
    zerolinecolor: chartTheme.zerolinecolor,
    error_band_line_color: chartTheme['error-band-line-color'],
    ohlc_increasing: chartTheme['ohlc-increasing'],
    ohlc_decreasing: chartTheme['ohlc-decreasing'],
    // Geo
    coastline_color: chartTheme['coastline-color'],
    land_color: chartTheme['land-color'],
    ocean_color: chartTheme['ocean-color'],
    lake_color: chartTheme['lake-color'],
    river_color: chartTheme['river-color'],
    // Indicator
    indicator_increasing: chartTheme['indicator-increasing'],
    indicator_decreasing: chartTheme['indicator-decreasing'],
    indicator_gauge: chartTheme['indicator-gauge'],
  });
}

export default defaultChartTheme;
