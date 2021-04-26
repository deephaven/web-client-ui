/* eslint-disable global-require */
// Create a partial plot with only the kinds of charts we need
// https://github.com/plotly/plotly.js/#modules

const Plotly = require('plotly.js/lib/core');

// Load in the trace types we need/support
Plotly.register([
  require('plotly.js/lib/bar'),
  require('plotly.js/lib/histogram'),
  require('plotly.js/lib/pie'),
  require('plotly.js/lib/ohlc'),
  require('plotly.js/lib/scattergl'),
]);

module.exports = Plotly;
