import { forwardRef, useMemo } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useConnection } from '@deephaven/jsapi-components';
import { assertNotNull } from '@deephaven/utils';
import {
  ChartModel,
  ChartModelFactory,
  ChartTheme,
  useChartTheme,
} from '@deephaven/chart';
import type { dh as DhType, IdeConnection } from '@deephaven/jsapi-types';
import { IrisGridUtils } from '@deephaven/iris-grid';
import { getTimeZone, store } from '@deephaven/redux';
import { type WidgetComponentProps } from '@deephaven/plugin';
import {
  ChartPanelMetadata,
  GLChartPanelState,
  isChartPanelDehydratedProps,
  isChartPanelTableMetadata,
} from './panels';
import ConnectedChartPanel, {
  type ChartPanel,
  type ChartPanelProps,
} from './panels/ChartPanel';

async function createChartModel(
  dh: DhType,
  chartTheme: ChartTheme,
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

    return ChartModelFactory.makeModel(dh, settings, figure, chartTheme);
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

  return ChartModelFactory.makeModelFromSettings(
    dh,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings as any,
    table,
    chartTheme
  );
}

export const ChartPlugin = forwardRef(
  (props: WidgetComponentProps, ref: React.Ref<ChartPanel>) => {
    const dh = useApi();
    const chartTheme = useChartTheme();
    const connection = useConnection();

    const hydratedProps = useMemo(
      () => ({
        ...(props as unknown as ChartPanelProps),
        metadata: props.metadata as ChartPanelMetadata,
        localDashboardId: props.localDashboardId,
        makeModel: () => {
          const { metadata } = props;

          const panelState = isChartPanelDehydratedProps(props)
            ? (props as unknown as ChartPanelProps).panelState
            : undefined;

          if (metadata == null) {
            throw new Error('Metadata is required for chart panel');
          }

          return createChartModel(
            dh,
            chartTheme,
            connection,
            metadata as ChartPanelMetadata,
            panelState
          );
        },
      }),
      [props, dh, chartTheme, connection]
    );

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <ConnectedChartPanel ref={ref} {...hydratedProps} />;
  }
);

ChartPlugin.displayName = 'ChartPlugin';

export default ChartPlugin;
