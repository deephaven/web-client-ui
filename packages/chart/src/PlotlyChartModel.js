/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */

import Log from '@deephaven/log';
import ChartModel from './ChartModel';

const log = Log.module('PlotlyChartModel');

/**
 * Model for a Plotly Chart
 * All of these methods should return very quickly.
 * If data needs to be loaded asynchronously, return something immediately, then trigger an event for the chart to refresh.
 */
class PlotlyChartModel extends ChartModel {
  /**
   * @param {Object} settings Chart settings
   * @param {Object} settings.data Plotly chart data
   * @param {Object} settings.layout Plotly chart layout
   * @param {Object} settings.frames Plotly chart frames
   */
  constructor({ data, layout, frames }) {
    super();

    this.data = data;
    this.frames = frames;
    this.layout = layout;

    // Fixed size charts not supported
    ['width', 'height'].forEach(prop => {
      delete this.layout[prop];
    });
    this.layout.autosize = true;
  }

  getData() {
    return this.data;
  }

  getLayout() {
    return this.layout;
  }

  getFrames() {
    return this.frames;
  }

  subscribe(...args) {
    super.subscribe(...args);
    this.fireLoadFinished();
  }
}

export default PlotlyChartModel;
