/* eslint-disable global-require */
// Create a partial plot with only the kinds of charts we need
// https://github.com/plotly/plotly.js/#modules

import Plotly from 'plotly.js/lib/core.js';
import bar from 'plotly.js/lib/bar.js';
import histogram from 'plotly.js/lib/histogram.js';
import pie from 'plotly.js/lib/pie.js';
import ohlc from 'plotly.js/lib/ohlc.js';
import scattergl from 'plotly.js/lib/scattergl.js';

// Load in the trace types we need/support
Plotly.register([bar, histogram, pie, ohlc, scattergl]);

export default Plotly;
