/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import { TableUtils } from '@deephaven/iris-grid';
import dh from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import ChartModel from './ChartModel';
import ChartUtils from './ChartUtils';

const log = Log.module('TableChartModel');

/**
 * Takes an Iris data table and some settings from chart builder to make a model for a chart
 */
class TableChartModel extends ChartModel {
  /**
   * Create a new model for displaying a chart from a table with chart builder settings.
   * The chart builder settings are an object conforming to the following:
   * TableChartSettings {
   *   @param {String} xAxis The name of the column in the table to use as the xAxis
   *   @param {String[]} series The columns to use as the series for this chart
   *   @param {String} title The title of the chart
   *   @param {dh.plot.SeriesPlotStyle.*} type The plot style to use for this chart
   * }
   * @param {TableChartSettings} settings The settings to use when pulling from a table
   * @param {dh.Table} table The table to build the chart fromt
   */
  constructor(settings, table) {
    super();

    this.handleSubscriptionUpdate = this.handleSubscriptionUpdate.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleReconnect = this.handleReconnect.bind(this);
    this.handleRequestFailed = this.handleRequestFailed.bind(this);

    const { xAxis, series, title, type: plotStyle } = settings;
    const xAxisColumn = table.columns.find(column => column.name === xAxis);
    const seriesColumns = table.columns.filter(
      column => series.indexOf(column.name) >= 0
    );
    if (seriesColumns.length === 0) {
      log.debug2('No series columns, using x-axis');
      seriesColumns.push(xAxisColumn);
    }

    const type = ChartUtils.getPlotlyChartType(plotStyle);
    const mode = ChartUtils.getPlotlyChartMode(plotStyle);
    const xAttributeName = ChartUtils.getPlotlyProperty(
      plotStyle,
      dh.plot.SourceType.X
    );
    const yAttributeName = ChartUtils.getPlotlyProperty(
      plotStyle,
      dh.plot.SourceType.Y
    );

    const data = [];
    for (let i = 0; i < seriesColumns.length; i += 1) {
      const seriesColumn = seriesColumns[i];
      const { name } = seriesColumn;
      const seriesData = ChartUtils.makeSeriesData(type, mode, name);

      seriesData[xAttributeName] = [];
      if (seriesColumn !== xAxisColumn) {
        seriesData[yAttributeName] = [];
      }

      const seriesVisibility = ChartUtils.getSeriesVisibility(name, settings);
      ChartUtils.addStylingToSeriesData(
        seriesData,
        plotStyle,
        undefined,
        undefined,
        seriesVisibility
      );

      if (plotStyle === dh.plot.SeriesPlotStyle.HISTOGRAM) {
        // Histograms built from the chart builder need the histogram function set
        seriesData.histfunc = 'sum';
      }

      data.push(seriesData);
    }

    const yAxis = series.length > 0 ? series[0] : '';

    const layout = ChartUtils.makeDefaultLayout();
    layout.title.text = title;
    layout.xaxis.title = xAxis;
    layout.yaxis.title = yAxis;

    if (plotStyle === dh.plot.SeriesPlotStyle.STACKED_BAR) {
      layout.barmode = 'stack';
    }

    this.data = data;
    this.layout = layout;
    this.seriesColumns = seriesColumns;
    this.settings = settings;
    this.table = table;
    this.xAxisColumn = xAxisColumn;
    this.xAttributeName = xAttributeName;
    this.yAttributeName = yAttributeName;
  }

  close() {
    this.table.close();
  }

  subscribe(...args) {
    super.subscribe(...args);

    if (this.listeners.length === 1) {
      this.subscribeTable();
    }
  }

  unsubscribe(...args) {
    super.unsubscribe(...args);

    if (this.listeners.length === 0) {
      this.unsubscribeTable();
    }
  }

  getData() {
    return this.data;
  }

  getLayout() {
    return this.layout;
  }

  handleSubscriptionUpdate(event) {
    const {
      data,
      seriesColumns,
      xAxisColumn,
      xAttributeName,
      yAttributeName,
    } = this;
    const { detail: subscriptionEvent } = event;
    const { added, removed, updated } = subscriptionEvent;

    log.debug2('handleSubscriptionUpdate', added, removed, updated);

    // Pre-allocate the array with the proper size for performance
    const rows = new Array(added.size);
    const iter = added.iterator();
    let iterIndex = 0;
    while (iter.hasNext()) {
      const rowIndex = iter.next().value;
      const row = subscriptionEvent.get(rowIndex);
      rows[iterIndex] = row;
      iterIndex += 1;
    }

    const x = rows.map(row => ChartUtils.unwrapValue(row.get(xAxisColumn)));

    for (let i = 0; i < seriesColumns.length; i += 1) {
      const seriesData = data[i];
      seriesData[xAttributeName] = seriesData[xAttributeName].concat(x);

      const seriesColumn = seriesColumns[i];
      if (seriesColumn !== xAxisColumn) {
        const y = rows.map(row =>
          ChartUtils.unwrapValue(row.get(seriesColumn))
        );
        seriesData[yAttributeName] = seriesData[yAttributeName].concat(y);
      }
    }

    this.fireUpdate(data);

    log.debug2('handleSubscriptionUpdate complete.');
  }

  handleRequestFailed(event) {
    log.error('Request failed', event);
  }

  handleDisconnect(event) {
    log.debug('Table disconnected', event);

    this.fireDisconnect();
  }

  handleReconnect(event) {
    log.debug('Table reconnected', event);

    this.fireReconnect();
  }

  getColumns() {
    const { settings, table } = this;
    const { series, xAxis, title } = settings;

    const columns = [TableUtils.getColumnByName(table, xAxis)];
    for (let i = 0; i < series.length; i += 1) {
      const column = TableUtils.getColumnByName(table, series[i]);
      if (columns.indexOf(column) < 0) {
        columns.push(column);
      }
    }

    return columns;
  }

  fetchTableData() {
    const { table } = this;
    const { xAxis, series } = this.settings;
    const columns = this.getColumns();

    log.debug2('Setting viewport (0,', table.size + 1, ')');
    table.setViewport(0, table.size + 1, columns);
  }

  subscribeTable() {
    const columns = this.getColumns();
    this.subscription = this.table.subscribe(columns);
    this.subscription.addEventListener(
      dh.TableSubscription.EVENT_UPDATED,
      this.handleSubscriptionUpdate
    );
    this.table.addEventListener(
      dh.Table.EVENT_DISCONNECT,
      this.handleDisconnect
    );
    this.table.addEventListener(dh.Table.EVENT_RECONNECT, this.handleReconnect);
  }

  unsubscribeTable() {
    this.subscription.close();
    this.subscription = null;
    this.table.removeEventListener(
      dh.Table.EVENT_DISCONNECT,
      this.handleDisconnect
    );
    this.table.removeEventListener(
      dh.Table.EVENT_RECONNECT,
      this.handleReconnect
    );
  }
}

export default TableChartModel;
