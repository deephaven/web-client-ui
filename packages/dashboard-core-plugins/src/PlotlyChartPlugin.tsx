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
            data_columns: Record<string, string | string[]>;
          }>;
          template?: unknown;
        };
        plotly: PlotlyDataLayoutConfig;
      } = JSON.parse(atob(widgetInfo.getDataAsBase64()));
      const objects = await Promise.all(
        widgetInfo.exportedObjects.map(obj => obj.fetch())
      );

      // Maps a column name to an array of the paths where its data should be
      const fetchColumnMap = new Map<string, string[]>();

      data.deephaven.mappings
        .flatMap(({ data_columns: dataColumns }) => Object.entries(dataColumns))
        .forEach(([columnName, dataPath]) => {
          const existingPaths = fetchColumnMap.get(columnName);
          const names = [dataPath].flat();
          if (existingPaths !== undefined) {
            existingPaths.push(...names);
          } else {
            fetchColumnMap.set(columnName, [...names]);
          }
        });

      const metadata = { name: title, figure: title };
      const makeModel = () =>
        ChartModelFactory.makePlotlyModelFromSettings(
          objects[0],
          data.plotly,
          fetchColumnMap
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
