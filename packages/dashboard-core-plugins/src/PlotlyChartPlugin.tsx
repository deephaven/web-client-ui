import { useCallback, DragEvent, useEffect } from 'react';
import { ChartModelFactory } from '@deephaven/chart';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  useListener,
  DEFAULT_DASHBOARD_ID,
  PanelHydrateFunction,
} from '@deephaven/dashboard';
import { Table, VariableDefinition } from '@deephaven/jsapi-shim';
import { useSelector } from 'react-redux';
import type { RootState } from '@deephaven/redux';
import { assertNotNull } from '@deephaven/utils';
import shortid from 'shortid';
import type { PlotlyDataLayoutConfig } from 'plotly.js';
import { ChartPanel, ChartPanelProps } from './panels';
import { getDashboardConnection } from './redux';

export type PlotlyChartPluginProps = Partial<DashboardPluginComponentProps>;

interface PlotlyChartWidget {
  getDataAsBase64(): string;
  exportedObjects: { fetch(): Promise<Table> }[];
}

interface PlotlyChartWidgetData {
  deephaven: {
    mappings: Array<{
      table: number;
      data_columns: Record<string, string[]>;
    }>;
    is_user_set_template: boolean;
    is_user_set_color: boolean;
  };
  plotly: PlotlyDataLayoutConfig;
}

function getWidgetData(widgetInfo: PlotlyChartWidget): PlotlyChartWidgetData {
  return JSON.parse(atob(widgetInfo.getDataAsBase64()));
}

async function getDataMappings(
  widgetInfo: PlotlyChartWidget
): Promise<Map<Table, Map<string, string[]>>> {
  const data = getWidgetData(widgetInfo);
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

  return tableColumnReplacementMap;
}

export function PlotlyChartPlugin(
  props: PlotlyChartPluginProps
): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const connection = useSelector((state: RootState) =>
    getDashboardConnection(state, DEFAULT_DASHBOARD_ID)
  );
  const { id, layout, registerComponent } = props;

  const hydrate: PanelHydrateFunction<ChartPanelProps> = useCallback(
    (hydrateProps, localDashboardId) => {
      const makeModel = async () => {
        const widgetInfo = ((await connection.getObject({
          type: 'deephaven.plugin.chart.DeephavenFigure',
          name: hydrateProps.metadata.name,
        })) as unknown) as PlotlyChartWidget;

        const data = getWidgetData(widgetInfo);
        const tableColumnReplacementMap = await getDataMappings(widgetInfo);
        return ChartModelFactory.makePlotlyModelFromSettings(
          tableColumnReplacementMap,
          data.plotly,
          !data.deephaven.is_user_set_template,
          !data.deephaven.is_user_set_color
        );
      };
      return {
        ...hydrateProps,
        localDashboardId,
        makeModel,
      };
    },
    [connection]
  );

  const handlePanelOpen = useCallback(
    async ({
      dragEvent,
      fetch,
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent?: DragEvent;
      fetch: () => Promise<PlotlyChartWidget>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { type, title } = widget;
      if (type !== 'deephaven.plugin.chart.DeephavenFigure') {
        return;
      }

      const widgetInfo = await fetch();

      const data = getWidgetData(widgetInfo);
      const tableColumnReplacementMap = await getDataMappings(widgetInfo);

      const metadata = { name: title, figure: title, type };
      const makeModel = () =>
        ChartModelFactory.makePlotlyModelFromSettings(
          tableColumnReplacementMap,
          data.plotly,
          !data.deephaven.is_user_set_template,
          !data.deephaven.is_user_set_color
        );
      const config = {
        type: 'react-component' as const,
        component: 'PlotlyPanel',
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

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        registerComponent(
          'PlotlyPanel',
          ChartPanel,
          hydrate as PanelHydrateFunction
        ),
      ];
      return () => {
        cleanups.forEach(cleanup => cleanup());
      };
    },
    [registerComponent, hydrate]
  );

  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);

  return null;
}

export default PlotlyChartPlugin;
