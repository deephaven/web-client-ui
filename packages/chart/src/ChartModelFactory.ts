import type { dh as DhType, Figure, Table } from '@deephaven/jsapi-types';
import type { PlotlyDataLayoutConfig } from 'plotly.js';
import ChartUtils, { ChartModelSettings } from './ChartUtils';
import FigureChartModel from './FigureChartModel';
import ChartTheme from './ChartTheme';
import ChartModel from './ChartModel';
import PlotlyChartModel from './PlotlyChartModel';

class ChartModelFactory {
  /**
   * Creates a model from the settings provided.
   * Tries to create a Figure in the API with it.
   * @param dh JSAPI instance
   * @param settings The chart builder settings
   * @param settings.isLinked Whether the newly created chart should stay linked with the original table, update when filters are updated
   * @param settings.series The column names to use for creating the series of this chart
   * @param settings.type Chart builder type, from ChartBuilder.types
   * @param settings.xAxis The column name to use for the x-axis
   * @param [settings.hiddenSeries] Array of hidden series names
   * @param table The table to build the model for
   * @param theme The theme for the figure. Defaults to ChartTheme
   * @returns The ChartModel Promise representing the figure
   * CRA sets tsconfig to type check JS based on jsdoc comments. It isn't able to figure out FigureChartModel extends ChartModel
   * This causes TS issues in 1 or 2 spots. Once this is TS it can be returned to just FigureChartModel
   */
  static async makeModelFromSettings(
    dh: DhType,
    settings: ChartModelSettings,
    table: Table,
    theme = ChartTheme
  ): Promise<ChartModel> {
    const figure = await ChartModelFactory.makeFigureFromSettings(
      dh,
      settings,
      table
    );
    return new FigureChartModel(dh, figure, settings, theme);
  }

  static async makePlotlyModelFromSettings(
    table: Table,
    plotlyConfig: PlotlyDataLayoutConfig,
    columnReplacements: Map<string, string[]>,
    theme = ChartTheme
  ): Promise<ChartModel> {
    return new PlotlyChartModel(
      table,
      plotlyConfig.data,
      plotlyConfig.layout ?? {},
      columnReplacements,
      theme
    );
  }

  /**
   * Creates a model from the settings provided.
   * Tries to create a Figure in the API with it.
   * @param dh DH JSAPI instance
   * @param settings The chart builder settings
   * @param settings.isLinked Whether the newly created chart should stay linked with the original table, update when filters are updated
   * @param settings.series The column names to use for creating the series of this chart
   * @param settings.type Chart builder type, from ChartBuilder.types
   * @param settings.xAxis The column name to use for the x-axis
   * @param [settings.hiddenSeries] Array of hidden series names
   * @param table The table to build the model for
   * @returns The Figure created with the settings provided
   */
  static async makeFigureFromSettings(
    dh: DhType,
    settings: ChartModelSettings,
    table: Table
  ): Promise<Figure> {
    // Copy the table first and then re-apply the filters from the original table
    // When we add table linking we'll want to listen to the original table and update
    // the copied table with any changes that occur.
    // The table gets owned by the Figure that gets created, which closes the table
    const tableCopy = await table.copy();
    tableCopy.applyCustomColumns(table.customColumns);
    tableCopy.applyFilter(table.filter);
    tableCopy.applySort(table.sort);

    return dh.plot.Figure.create(
      new ChartUtils(dh).makeFigureSettings(settings, tableCopy)
    );
  }

  /**
   * Creates a model from the settings provided.
   * Tries to create a Figure in the API with it.
   * @param dh DH JSAPI instance
   * @param settings The chart builder settings
   * @param settings.isLinked Whether the newly created chart should stay linked with the original table, update when filters are updated
   * @param settings.series The column names to use for creating the series of this chart
   * @param settings.type Chart builder type, from ChartBuilder.types
   * @param settings.xAxis The column name to use for the x-axis
   * @param [settings.hiddenSeries] Array of hidden series names
   * @param figure The figure to build the model for
   * @param theme The theme for the figure. Defaults to ChartTheme
   * @returns The FigureChartModel representing the figure
   * CRA sets tsconfig to type check JS based on jsdoc comments. It isn't able to figure out FigureChartModel extends ChartModel
   * This causes TS issues in 1 or 2 spots. Once this is TS it can be returned to just FigureChartModel
   */
  static async makeModel(
    dh: DhType,
    settings: ChartModelSettings | undefined,
    figure: Figure,
    theme = ChartTheme
  ): Promise<ChartModel> {
    return new FigureChartModel(dh, figure, settings, theme);
  }
}

export default ChartModelFactory;
