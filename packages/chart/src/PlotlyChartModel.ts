import dh, { ChartData, Table, TableSubscription } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';
import { Layout, Data } from 'plotly.js';
import ChartModel, { ChartEvent } from './ChartModel';
import ChartUtils from './ChartUtils';
import ChartTheme from './ChartTheme';

const log = Log.module('PlotlyChartModel');

class PlotlyChartModel extends ChartModel {
  constructor(
    table: Table,
    data: Data[],
    layout: Partial<Layout>,
    columnReplacements: Map<string, string[]>,
    theme: typeof ChartTheme = ChartTheme
  ) {
    super();

    this.handleFigureUpdated = this.handleFigureUpdated.bind(this);

    this.table = table;
    this.columnReplacements = columnReplacements;
    this.chartData = new dh.plot.ChartData(table);
    this.theme = theme;
    this.data = data;
    const template = { data: {}, layout: ChartUtils.makeDefaultLayout(theme) };
    this.layout = {
      ...layout,
      template,
    };

    this.setTitle(this.getDefaultTitle());
  }

  table: Table;

  tableSubscription?: TableSubscription;

  columnReplacements: Map<string, string[]>;

  chartData: ChartData;

  theme: typeof ChartTheme;

  data: Partial<Data>[];

  layout: Partial<Layout>;

  close(): void {
    this.tableSubscription?.close();
    this.stopListening();
  }

  getData(): Partial<Data>[] {
    return this.data;
  }

  getLayout(): Partial<Layout> {
    return this.layout;
  }

  subscribe(callback: (event: ChartEvent) => void): void {
    super.subscribe(callback);

    const columnNames = new Set(this.columnReplacements.keys());
    const columns = this.table.columns.filter(({ name }) =>
      columnNames.has(name)
    );

    this.tableSubscription = this.table.subscribe(columns);
    this.startListening();
  }

  handleFigureUpdated(event: ChartEvent): void {
    const { detail: figureUpdateEvent } = event;
    this.chartData.update(figureUpdateEvent);

    this.columnReplacements.forEach((destinations, column) => {
      const columnData = this.chartData.getColumn(
        column,
        val => val,
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
    this.tableSubscription?.addEventListener(
      dh.Table.EVENT_UPDATED,
      this.handleFigureUpdated
    );
  }

  stopListening(): void {
    this.tableSubscription?.removeEventListener(
      dh.Table.EVENT_UPDATED,
      this.handleFigureUpdated
    );
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
