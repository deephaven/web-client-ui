import { resolveCssVariablesInRecord } from '@deephaven/components';
import Log from '@deephaven/log';
import chartThemeRaw from './ChartTheme.module.scss';

const log = Log.module('ChartTheme');

export interface ChartTheme {
  paper_bgcolor: string;
  plot_bgcolor: string;
  title_color: string;
  colorway: string;
  gridcolor: string;
  linecolor: string;
  zerolinecolor: string;
  activecolor: string;
  rangebgcolor: string;
  area_color: string;
  trend_color: string;
  line_color: string;
  error_band_line_color: string;
  error_band_fill_color: string;
  ohlc_increasing: string;
  ohlc_decreasing: string;
}

export function defaultChartTheme(): Readonly<ChartTheme> {
  const chartTheme = resolveCssVariablesInRecord(chartThemeRaw);

  log.debug2('Chart theme:', chartThemeRaw);
  log.debug2('Chart theme derived:', chartTheme);

  return Object.freeze({
    paper_bgcolor: chartTheme['paper-bgcolor'],
    plot_bgcolor: chartTheme['plot-bgcolor'],
    title_color: chartTheme['title-color'],
    colorway: chartTheme.colorway,
    gridcolor: chartTheme.gridcolor,
    linecolor: chartTheme.linecolor,
    zerolinecolor: chartTheme.zerolinecolor,
    activecolor: chartTheme.activecolor,
    rangebgcolor: chartTheme.rangebgcolor,
    area_color: chartTheme['area-color'],
    trend_color: chartTheme['trend-color'],
    line_color: chartTheme['line-color'],
    error_band_line_color: chartTheme['error-band-line-color'],
    error_band_fill_color: chartTheme['error-band-fill-color'],
    ohlc_increasing: chartTheme['ohlc-increasing'],
    ohlc_decreasing: chartTheme['ohlc-decreasing'],
  });
}

export default defaultChartTheme;
