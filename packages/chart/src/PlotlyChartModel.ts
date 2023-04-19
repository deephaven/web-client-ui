import dh from '@deephaven/jsapi-shim';
import type {
  ChartData,
  Table,
  TableSubscription,
} from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import { Layout, Data } from 'plotly.js';
import ChartModel, { ChartEvent } from './ChartModel';
import ChartUtils, { isPlotData } from './ChartUtils';
import ChartTheme from './ChartTheme';

const log = Log.module('PlotlyChartModel');

class PlotlyChartModel extends ChartModel {
  constructor(
    tableColumnReplacementMap: ReadonlyMap<Table, Map<string, string[]>>,
    data: Data[],
    plotlyLayout: Partial<Layout>,
    isDefaultTemplate = true,
    theme: typeof ChartTheme = ChartTheme
  ) {
    super();

    this.handleFigureUpdated = this.handleFigureUpdated.bind(this);

    this.tableColumnReplacementMap = new Map(tableColumnReplacementMap);
    this.chartDataMap = new Map();
    this.tableSubscriptionMap = new Map();

    this.theme = theme;
    this.data = data;
    const template = { layout: ChartUtils.makeDefaultLayout(theme) };

    // For now we will only use the plotly theme colorway since most plotly themes are light mode
    if (!isDefaultTemplate) {
      template.layout.colorway =
        plotlyLayout.template?.layout?.colorway ?? template.layout.colorway;
    }

    this.plotlyLayout = plotlyLayout;

    this.layout = {
      ...plotlyLayout,
      template,
    };

    this.applyColorwayToData();

    this.setTitle(this.getDefaultTitle());
  }

  tableSubscriptionMap: Map<Table, TableSubscription>;

  tableSubscriptionCleanups: (() => void)[] = [];

  tableColumnReplacementMap: Map<Table, Map<string, string[]>>;

  chartDataMap: Map<Table, ChartData>;

  theme: typeof ChartTheme;

  data: Data[];

  layout: Partial<Layout>;

  plotlyLayout: Partial<Layout>;

  getData(): Partial<Data>[] {
    return this.data;
  }

  getLayout(): Partial<Layout> {
    return this.layout;
  }

  /**
   * Applies the model template colorway to the data unless the data color is not its default value
   * Data color is not default if the user set the color specifically or the plot type sets it
   */
  applyColorwayToData(): void {
    const colorway = this.layout?.template?.layout?.colorway ?? [];
    const plotlyColorway = this.plotlyLayout?.template?.layout?.colorway ?? [];

    if (colorway.length === 0) {
      return;
    }

    // Remove colors set on traces by plotly on the server
    for (let i = 0; i < this.data.length; i += 1) {
      const d = this.data[i];
      const color = colorway[i % colorway.length];

      // If length is 0, plotlyColorway[NaN] is undefined and does not throw
      const plotlyColor = plotlyColorway[i % plotlyColorway.length] ?? '';

      if (isPlotData(d)) {
        const { marker, line } = d;
        if (marker?.color === plotlyColor && color != null) {
          marker.color = color;
        }

        if (line?.color === plotlyColor && color != null) {
          line.color = color;
        }
      }
    }
  }

  subscribe(callback: (event: ChartEvent) => void): void {
    super.subscribe(callback);

    this.tableColumnReplacementMap.forEach((_, table) =>
      this.chartDataMap.set(table, new dh.plot.ChartData(table))
    );

    this.tableColumnReplacementMap.forEach((columnReplacements, table) => {
      const columnNames = new Set(columnReplacements.keys());
      const columns = table.columns.filter(({ name }) => columnNames.has(name));
      this.tableSubscriptionMap.set(table, table.subscribe(columns));
    });

    this.startListening();
  }

  unsubscribe(callback: (event: ChartEvent) => void): void {
    super.unsubscribe(callback);

    this.stopListening();

    this.tableSubscriptionMap.forEach(sub => sub.close());
    this.chartDataMap.clear();
  }

  handleFigureUpdated(
    event: ChartEvent,
    chartData: ChartData | undefined,
    columnReplacements: Map<string, string[]> | undefined
  ): void {
    if (chartData == null || columnReplacements == null) {
      log.warn(
        'Unknown chartData or columnReplacements for this event. Skipping update'
      );
      return;
    }
    const { detail: figureUpdateEvent } = event;
    chartData.update(figureUpdateEvent);

    columnReplacements.forEach((destinations, column) => {
      const columnData = chartData.getColumn(
        column,
        val => ChartUtils.unwrapValue(val),
        figureUpdateEvent
      );
      destinations.forEach(destination => {
        // The JSON pointer starts w/ /plotly and we don't need that part
        const parts = destination
          .split('/')
          .filter(part => part !== '' && part !== 'plotly');
        // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-explicit-any
        let selector: any = this;
        for (let i = 0; i < parts.length; i += 1) {
          if (i !== parts.length - 1) {
            selector = selector[parts[i]];
          } else {
            selector[parts[i]] = columnData;
          }
        }
      });
    });

    const { data } = this;
    this.fireUpdate(data);
  }

  startListening(): void {
    this.tableSubscriptionMap.forEach((sub, table) => {
      this.tableSubscriptionCleanups.push(
        sub.addEventListener(dh.Table.EVENT_UPDATED, e =>
          this.handleFigureUpdated(
            e,
            this.chartDataMap.get(table),
            this.tableColumnReplacementMap.get(table)
          )
        )
      );
    });
  }

  stopListening(): void {
    this.tableSubscriptionCleanups.forEach(cleanup => cleanup());
  }

  getPlotWidth(): number {
    if (!this.rect || !this.rect.width) {
      return 0;
    }

    return Math.max(
      this.rect.width -
        (this.layout.margin?.l ?? 0) -
        (this.layout.margin?.r ?? 0),
      0
    );
  }

  getPlotHeight(): number {
    if (!this.rect || !this.rect.height) {
      return 0;
    }

    return Math.max(
      this.rect.height -
        (this.layout.margin?.t ?? 0) -
        (this.layout.margin?.b ?? 0),
      0
    );
  }
}

export default PlotlyChartModel;
