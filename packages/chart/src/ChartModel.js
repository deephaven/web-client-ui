/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
/**
 * Model for a Chart
 * All of these methods should return very quickly.
 * If data needs to be loaded asynchronously, return something immediately, then trigger an event for the chart to refresh.
 */
class ChartModel {
  static EVENT_UPDATED = 'ChartModel.EVENT_UPDATED';

  static EVENT_DISCONNECT = 'ChartModel.EVENT_DISCONNECT';

  static EVENT_RECONNECT = 'ChartModel.EVENT_RECONNECT';

  static EVENT_DOWNSAMPLESTARTED = 'ChartModel.EVENT_DOWNSAMPLESTARTED';

  static EVENT_DOWNSAMPLEFINISHED = 'ChartModel.EVENT_DOWNSAMPLEFINISHED';

  static EVENT_DOWNSAMPLEFAILED = 'ChartModel.EVENT_DOWNSAMPLEFAILED';

  static EVENT_DOWNSAMPLENEEDED = 'ChartModel.EVENT_DOWNSAMPLENEEDED';

  static EVENT_LOADFINISHED = 'ChartModel.EVENT_LOADFINISHED';

  constructor() {
    this.listeners = [];
    this.formatter = null;
    this.rect = null;
    this.isDownsamplingDisabled = false;
    this.title = null;
  }

  getData() {
    return [];
  }

  getDefaultTitle() {
    return '';
  }

  getLayout() {
    return {};
  }

  getFrames() {
    return undefined;
  }

  getFilterColumnMap() {
    return new Map();
  }

  isFilterRequired() {
    return false;
  }

  setFilter() {}

  /**
   * Close this model, clean up any underlying subscriptions
   */
  close() {}

  /**
   * Set the formatter to use when charting the data.
   * @param {Formatter} formatter The formatter to use to format the charting data
   */
  setFormatter(formatter) {
    this.formatter = formatter;
  }

  /**
   * Disable downsampling
   * @param {boolean} isDownsamplingDisabled True if downsampling should be disabled
   */
  setDownsamplingDisabled(isDownsamplingDisabled) {
    this.isDownsamplingDisabled = isDownsamplingDisabled;
  }

  /**
   * Set the dimensions of the plot. May be needed to evaluate some of the percents
   * @param {DOMRect} rect The bounding rectangle of the plot
   */
  setDimensions(rect) {
    this.rect = rect;
  }

  setTitle(title) {
    this.title = title;
  }

  /**
   * Subscribe to this ChartModel and start listening for all events.
   * @param {Function<Event>} callback Callback when an event occurs
   */
  subscribe(callback) {
    this.listeners.push(callback);
  }

  unsubscribe(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  fireEvent(event) {
    for (let i = 0; i < this.listeners.length; i += 1) {
      this.listeners[i](event);
    }
  }

  fireUpdate(data) {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_UPDATED, { detail: data }));
  }

  fireDisconnect() {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_DISCONNECT));
  }

  fireReconnect() {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_RECONNECT));
  }

  fireDownsampleStart(detail) {
    this.fireEvent(
      new CustomEvent(ChartModel.EVENT_DOWNSAMPLESTARTED, { detail })
    );
  }

  fireDownsampleFinish(detail) {
    this.fireEvent(
      new CustomEvent(ChartModel.EVENT_DOWNSAMPLEFINISHED, { detail })
    );
  }

  fireDownsampleFail(detail) {
    this.fireEvent(
      new CustomEvent(ChartModel.EVENT_DOWNSAMPLEFAILED, { detail })
    );
  }

  fireDownsampleNeeded(detail) {
    this.fireEvent(
      new CustomEvent(ChartModel.EVENT_DOWNSAMPLENEEDED, { detail })
    );
  }

  fireLoadFinished() {
    this.fireEvent(new CustomEvent(ChartModel.EVENT_LOADFINISHED));
  }
}

export default ChartModel;
