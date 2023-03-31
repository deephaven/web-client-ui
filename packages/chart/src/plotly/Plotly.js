/* eslint-disable global-require */
// Create a partial plot with only the kinds of charts we need
// https://github.com/plotly/plotly.js/#modules

import Plotly from 'plotly.js/lib/core.js';
import bar from 'plotly.js/lib/bar.js';
import box from 'plotly.js/lib/box.js';
import candlestick from 'plotly.js/lib/candlestick.js';
import funnel from 'plotly.js/lib/funnel.js';
import funnelarea from 'plotly.js/lib/funnelarea.js';
import histogram from 'plotly.js/lib/histogram.js';
import icicle from 'plotly.js/lib/icicle.js';
import pie from 'plotly.js/lib/pie.js';
import ohlc from 'plotly.js/lib/ohlc.js';
import scattergl from 'plotly.js/lib/scattergl.js';
import scatter3d from 'plotly.js/lib/scatter3d';
import scatterPolar from 'plotly.js/lib/scatterpolar';
import scatterpolargl from 'plotly.js/lib/scatterpolargl';
import sunburst from 'plotly.js/lib/sunburst.js';
import treemap from 'plotly.js/lib/treemap.js';
import violin from 'plotly.js/lib/violin.js';

// Load in the trace types we need/support
Plotly.register([
  bar,
  box,
  candlestick,
  funnel,
  funnelarea,
  histogram,
  icicle,
  pie,
  ohlc,
  scattergl,
  scatter3d,
  scatterPolar,
  scatterpolargl,
  sunburst,
  treemap,
  violin,
]);

export default Plotly;
