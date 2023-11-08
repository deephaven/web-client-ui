/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment

import type { dh as DhType } from '@deephaven/jsapi-types';
import type { Datum, Layout, PlotData } from 'plotly.js';
import ChartModel from './ChartModel';
import { ChartTheme, defaultChartTheme } from './ChartTheme';
import ChartUtils from './ChartUtils';

interface Series {
  x: PlotData['x'];
  y: PlotData['y'];
  s: number[];
  l: number[];
}

/** Displays a basic random chart */
class MockChartModel extends ChartModel {
  static smoothing = 1.5;

  static _theme: ChartTheme;

  static get theme(): ChartTheme {
    /* eslint-disable no-underscore-dangle */
    if (MockChartModel._theme == null) {
      MockChartModel._theme = defaultChartTheme();
    }

    return MockChartModel._theme;
    /* eslint-enable no-underscore-dangle */
  }

  static makeRandomSeries(offset: number, scale = 1, steps = 100): Series {
    const dates = [];
    const values = [];
    const smooth = [];
    const linear = [];
    const startDate = new Date();

    for (let i = 0; i < steps; i += 1) {
      const date = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() + i - steps
      );
      dates.push(
        `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      );
      let v =
        ((Math.sin((i / steps) * offset) * steps) / 3 +
          (Math.cos(i * 0.2) * steps) / 6 +
          (Math.sin(i * 0.5) * steps) / 10 +
          (Math.random() * steps) / 5 +
          i * MockChartModel.smoothing) *
        scale;
      v = Math.round(v * 100) / 100; // 2 decimals only
      // using steps acts as amplititude scaling based on value
      // large sine wave for course shape  + small sine waves for bumpiness +
      // general randomness noise + index to be constantly up and to the right + smoothing factor
      values.push(v);
      linear.push(40 + i * MockChartModel.smoothing);
      smooth.push(
        (Math.sin((i / steps) * offset) * steps) / 3 +
          (Math.random() * steps) / 10 +
          i * MockChartModel.smoothing
      ); // push a smoother version of the same thing
    }

    return { x: dates, y: values, s: smooth, l: linear };
  }

  static makeScatter(series: Series): Partial<PlotData> {
    return {
      name: 'SCTR',
      x: series.x,
      y: series.y,
      type: 'scatter',
      mode: 'markers',
      hoverinfo: 'skip',
      marker: {
        size: 5,
      },
    };
  }

  static makeArea(series: Series): Partial<PlotData> {
    return {
      name: 'AREA',
      x: series.x,
      y: series.s,
      type: 'scatter',
      mode: 'line' as PlotData['mode'],
      fill: 'tozeroy',
      hoverinfo: 'all',
      line: {
        color: MockChartModel.theme.area_color,
        width: 3,
        // area patten gets applied as hack in post render plot.ly callback + css
      },
    };
  }

  static makeTrendline(series: Series): Partial<PlotData> {
    return {
      // we probably want to toss the line formula in legend I guess? either that or render it as text manually on plot
      name: 'Trendline <br>R<sup>2</sup> = 0.91',
      x: series.x,
      y: series.l,
      type: 'scatter',
      mode: 'line' as PlotData['mode'],
      hoverinfo: 'skip',
      line: {
        width: 3,
        dash: 'dot', // trendlines should follow some sort of color convention + dots/dashed. Remember there can multiple
        color: MockChartModel.theme.trend_color,
        // chroma(c.$green).brighten(1.2).hex()
      },
    };
  }

  static makeErrorBand(series: Series): Partial<PlotData> {
    // generate continouous error bands values and text
    const erroryforward = [];
    const errorybackward = [];
    for (let i = 0; i < series.y.length; i += 1) {
      const value = series.y[i] as number;
      erroryforward[i] = Math.round((value + 18) * 100) / 100;
      errorybackward[i] = Math.round((value - 18) * 100) / 100;
    }

    // makes a closed shape of points winding clockwise for y values
    const errory = erroryforward.concat(errorybackward.reverse());

    return {
      name: 'error',
      x: (series.x as Datum[]).concat((series.x as Datum[]).slice().reverse()), // winding for x values, that slice just clones so reverse doesn't apply inplace
      y: errory,
      type: 'scatter',
      mode: 'line' as PlotData['mode'],
      hoverinfo: 'skip',
      fill: 'toself', // there's some ordering bug with scattergl where if the areas traces are ordered after the lines they don't render
      fillcolor: MockChartModel.theme.error_band_fill_color,
      line: {
        width: 0,
        color: MockChartModel.theme.error_band_line_color,
        shape: 'spline',
      },
    };
  }

  static makeLine(series: Series): Partial<PlotData> {
    return {
      name: 'LINE',
      x: series.x,
      y: series.y,
      type: 'scatter',
      mode: 'line' as PlotData['mode'],
      hoverinfo: 'x+y+text+name' as PlotData['hoverinfo'],
      line: {
        color: MockChartModel.theme.line_color,
        width: 3,
      },
    };
  }

  static makeRandomData(): Partial<PlotData>[] {
    const series1 = MockChartModel.makeRandomSeries(6);
    const areaPattern = MockChartModel.makeArea(series1);
    const trendLine = MockChartModel.makeTrendline(series1);

    const series2 = MockChartModel.makeRandomSeries(2);
    const line = MockChartModel.makeLine(series2);
    const errorBand = MockChartModel.makeErrorBand(series2);

    return [areaPattern, trendLine, line, errorBand];
  }

  static makeDefaultLayout(dh: DhType): Partial<Layout> {
    const layout = new ChartUtils(dh).makeDefaultLayout(MockChartModel.theme);
    layout.title = 'Chart';

    if (layout.xaxis) {
      layout.xaxis.title = 'Datestamp';
    }

    if (layout.yaxis) {
      layout.yaxis.title = 'Price';
    }

    return layout;
  }

  constructor(
    dh: DhType,
    {
      data = MockChartModel.makeRandomData(),
      layout = MockChartModel.makeDefaultLayout(dh),
      filterFields = [],
    } = {}
  ) {
    super(dh);

    this.data = data;
    this.layout = layout;
    this.filterFields = filterFields;
  }

  data: Partial<PlotData>[];

  filterFields: string[];

  layout: Partial<Layout>;

  getData(): Partial<PlotData>[] {
    return this.data;
  }

  getLayout(): Partial<Layout> {
    return this.layout;
  }

  getFilterColumnMap(): Map<string, { name: string; type: string }> {
    const map = new Map();

    for (let i = 0; i < this.filterFields.length; i += 1) {
      const name = this.filterFields[i];
      const type = 'java.lang.String';
      map.set(name, { name, type });
    }

    return map;
  }

  isFilterRequired(): boolean {
    return this.filterFields.length > 0;
  }

  setFilter(): void {
    this.fireUpdate(this.data);
  }
}

export default MockChartModel;
