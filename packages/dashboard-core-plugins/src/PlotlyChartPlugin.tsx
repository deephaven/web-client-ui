import { useCallback, DragEvent } from 'react';
import { ChartModelFactory } from '@deephaven/chart';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  useListener,
} from '@deephaven/dashboard';
import { dh, Table, VariableDefinition } from '@deephaven/jsapi-shim';
import { assertNotNull } from '@deephaven/utils';
import shortid from 'shortid';
import type { PlotlyDataLayoutConfig } from 'plotly.js';
import { ChartPanel } from './panels/ChartPanel';

export type PlotlyChartPluginProps = Partial<DashboardPluginComponentProps>;

export function PlotlyChartPlugin(
  props: PlotlyChartPluginProps
): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const { id, layout, registerComponent } = props;
  const handlePanelOpen = useCallback(
    async ({
      dragEvent,
      fetch,
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent?: DragEvent;
      fetch: () => Promise<{
        getDataAsBase64(): string;
        exportedObjects: { fetch(): Promise<Table> }[];
      }>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { type, title } = widget;
      if ((type as unknown) !== 'deephaven.plugin.chart.DeephavenFigure') {
        return;
      }

      const widgetInfo = await fetch();
      const data: {
        deephaven: {
          mappings: Array<{
            table: number;
            data_columns: Record<string, string[]>;
          }>;
          template?: unknown;
        };
        plotly: PlotlyDataLayoutConfig;
      } = JSON.parse(atob(widgetInfo.getDataAsBase64()));
      const tables = await Promise.all(
        widgetInfo.exportedObjects.map(obj => obj.fetch())
      );

      // Maps a table to a map of column name to an array of the paths where its data should be
      const tableColumnReplacementMap = new Map<Table, Map<string, string[]>>();
      tables.forEach(table => tableColumnReplacementMap.set(table, new Map()));

      data.deephaven.mappings.forEach(
        ({ table: tableIndex, data_columns: dataColumns }) => {
          const table = tables[tableIndex];
          const existingColumnMap = tableColumnReplacementMap.get(table);
          assertNotNull(existingColumnMap);

          // For each { columnName: [replacePaths] } in the object, add to the tableColumnReplacementMap
          Object.entries(dataColumns).forEach(([columnName, paths]) => {
            const existingPaths = existingColumnMap.get(columnName);
            if (existingPaths !== undefined) {
              existingPaths.push(...paths);
            } else {
              existingColumnMap.set(columnName, [...paths]);
            }
          });
        }
      );

      const metadata = { name: title, figure: title };
      const makeModel = () =>
        ChartModelFactory.makePlotlyModelFromSettings(
          tableColumnReplacementMap,
          data.plotly
        );
      const config = {
        type: 'react-component' as const,
        component: ChartPanel.COMPONENT,
        props: {
          localDashboardId: id,
          id: panelId,
          metadata,
          makeModel,
        },
        title,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [id, layout]
  );

  // useEffect(
  //   function registerComponentsAndReturnCleanup() {
  //     const cleanups = [
  //       registerComponent(
  //         ChartPanel.COMPONENT,
  //         ChartPanel,
  //         hydrate as PanelHydrateFunction
  //       ),
  //     ];
  //     return () => {
  //       cleanups.forEach(cleanup => cleanup());
  //     };
  //   },
  //   [hydrate, registerComponent]
  // );

  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);

  return null;
}

export default PlotlyChartPlugin;
