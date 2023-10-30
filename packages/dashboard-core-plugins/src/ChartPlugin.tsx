import { useCallback } from 'react';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  DehydratedDashboardPanelProps,
  useDashboardPanel,
} from '@deephaven/dashboard';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useConnection } from '@deephaven/jsapi-components';
import { assertNotNull } from '@deephaven/utils';
import { ChartModel, ChartModelFactory } from '@deephaven/chart';
import type { dh as DhType, IdeConnection } from '@deephaven/jsapi-types';
import { IrisGridUtils } from '@deephaven/iris-grid';
import { getTimeZone, store } from '@deephaven/redux';
import {
  ChartPanel,
  ChartPanelMetadata,
  GLChartPanelState,
  isChartPanelDehydratedProps,
  isChartPanelTableMetadata,
} from './panels';

async function createChartModel(
  dh: DhType,
  connection: IdeConnection,
  metadata: ChartPanelMetadata,
  panelState?: GLChartPanelState
): Promise<ChartModel> {
  let settings;
  let tableName;
  let figureName;
  let tableSettings;

  if (isChartPanelTableMetadata(metadata)) {
    settings = metadata.settings;
    tableName = metadata.table;
    figureName = undefined;
    tableSettings = metadata.tableSettings;
  } else {
    settings = {};
    tableName = '';
    figureName = metadata.name ?? metadata.figure;
    tableSettings = {};
  }
  if (panelState != null) {
    if (panelState.tableSettings != null) {
      tableSettings = panelState.tableSettings;
    }
    if (panelState.table != null) {
      tableName = panelState.table;
    }
    if (panelState.figure != null) {
      figureName = panelState.figure;
    }
    if (panelState.settings != null) {
      settings = {
        ...settings,
        ...panelState.settings,
      };
    }
  }

  if (figureName != null) {
    const definition = {
      title: figureName,
      name: figureName,
      type: dh.VariableType.FIGURE,
    };
    const figure = await connection.getObject(definition);

    return ChartModelFactory.makeModel(dh, settings, figure);
  }

  const definition = {
    title: figureName,
    name: tableName,
    type: dh.VariableType.TABLE,
  };
  const table = await connection.getObject(definition);
  const timeZone = getTimeZone(store.getState());
  assertNotNull(timeZone);
  new IrisGridUtils(dh).applyTableSettings(table, tableSettings, timeZone);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ChartModelFactory.makeModelFromSettings(dh, settings as any, table);
}

export function ChartPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const dh = useApi();
  const connection = useConnection();

  const hydrate = useCallback(
    (hydrateProps: DehydratedDashboardPanelProps, id: string) => ({
      ...hydrateProps,
      localDashboardId: id,
      makeModel: () => {
        const { metadata } = hydrateProps;
        const panelState = isChartPanelDehydratedProps(hydrateProps)
          ? hydrateProps.panelState
          : undefined;
        if (metadata == null) {
          throw new Error('Metadata is required for chart panel');
        }

        return createChartModel(dh, connection, metadata, panelState);
      },
    }),
    [dh, connection]
  );

  useDashboardPanel({
    dashboardProps: props,
    componentName: ChartPanel.COMPONENT,
    component: ChartPanel,
    supportedTypes: dh.VariableType.FIGURE,
    hydrate,
  });

  return null;
}

export default ChartPlugin;
