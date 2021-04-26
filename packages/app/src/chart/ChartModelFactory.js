import dh from '@deephaven/jsapi-shim';
import ChartUtils from './ChartUtils';
import FigureChartModel from './FigureChartModel';
import TableChartModel from './TableChartModel';

class ChartModelFactory {
  /**
   * Creates a model from the settings provided.
   * Tries to create a Figure in the API with it, but falls back
   * to a TableChartModel in some cases (like Histogram).
   * @param {Object} settings The chart builder settings
   * @param {boolean} settings.isLinked Whether the newly created chart should stay linked with the original table, update when filters are updated
   * @param {string[]} settings.series The column names to use for creating the series of this chart
   * @param {string} settings.sourcePanelId The panel ID the chart was created from
   * @param {string} settings.type Chart builder type, from ChartBuilder.types
   * @param {string} settings.xAxis The column name to use for the x-axis
   * @param {string[]} settings.hiddenSeries Array of hidden series names
   * @param {dh.Table} table The table to build the model for
   * @returns {Promise<FigureChartModel>} The FigureChartModel representing the figure
   */
  static async makeModelFromSettings(settings, table) {
    const { type } = settings;
    if (type === dh.plot.SeriesPlotStyle.HISTOGRAM) {
      // Histogram plots aren't supported by the way we're create the charts in the API yet
      // Right now preserve legacy behaviour rather than break it completely.
      // TODO: Need to expose/use histogram function in API?
      return Promise.resolve(new TableChartModel(settings, table));
    }

    // Copy the table first and then re-apply the filters from the original table
    // When we add table linking we'll want to listen to the original table and update
    // the copied table with any changes that occur.
    // The table gets owned by the Figure that gets created, which closes the table
    return table.copy().then(tableCopy => {
      tableCopy.applyCustomColumns(table.customColumns);
      tableCopy.applyFilter(table.filter);
      tableCopy.applySort(table.sort);

      return dh.plot.Figure.create(
        ChartUtils.makeFigureSettings(settings, tableCopy)
      ).then(figure => new FigureChartModel(figure, settings));
    });
  }
}

export default ChartModelFactory;
