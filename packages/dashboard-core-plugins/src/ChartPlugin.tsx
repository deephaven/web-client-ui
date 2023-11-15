import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { useConnection } from '@deephaven/jsapi-components';
import {
  Chart,
  ChartModel,
  ChartModelFactory,
  ChartTheme,
  useChartTheme,
} from '@deephaven/chart';
import type {
  dh as DhType,
  Figure,
  IdeConnection,
} from '@deephaven/jsapi-types';
import { IrisGridUtils } from '@deephaven/iris-grid';
import { getTimeZone, store } from '@deephaven/redux';
import { WidgetPanelProps, type WidgetComponentProps } from '@deephaven/plugin';
import {
  ChartPanelMetadata,
  GLChartPanelState,
  isChartPanelDehydratedProps,
  isChartPanelFigureMetadata,
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
  fetch: () => Promise<Figure>,
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
    figureName = isChartPanelFigureMetadata(metadata)
      ? metadata.figure
      : metadata.name;
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

  if (figureName == null && tableName == null) {
    const figure = await fetch();

    return ChartModelFactory.makeModel(dh, settings, figure, chartTheme);
  }

  if (figureName != null) {
    let figure: Figure;

    if (metadata.type === dh.VariableType.FIGURE) {
      const definition = {
        name: figureName,
        type: dh.VariableType.FIGURE,
      };
      figure = await connection.getObject(definition);
    } else {
      figure = await fetch();
    }

    return ChartModelFactory.makeModel(dh, settings, figure, chartTheme);
  }

  const definition = {
    name: tableName,
    type: dh.VariableType.TABLE,
  };
  const table = await connection.getObject(definition);
  new IrisGridUtils(dh).applyTableSettings(
    table,
    tableSettings,
    getTimeZone(store.getState())
  );

  return ChartModelFactory.makeModelFromSettings(
    dh,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings as any,
    table,
    chartTheme
  );
}

export function ChartPlugin(props: WidgetComponentProps): JSX.Element | null {
  const dh = useApi();
  const chartTheme = useChartTheme();
  const [model, setModel] = useState<ChartModel>();

  const { fetch } = props;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const figure = (await fetch()) as unknown as Figure;
      const newModel = await ChartModelFactory.makeModel(
        dh,
        undefined,
        figure,
        chartTheme
      );

      if (!cancelled) {
        setModel(newModel);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch, chartTheme]);

  return model ? <Chart model={model} /> : null;
}

export const ChartPanelPlugin = forwardRef(
  (props: WidgetPanelProps, ref: React.Ref<ChartPanel>) => {
    const dh = useApi();
    const chartTheme = useChartTheme();
    const connection = useConnection();

    const panelState = isChartPanelDehydratedProps(props)
      ? (props as unknown as ChartPanelProps).panelState
      : undefined;

    const { fetch, metadata, localDashboardId } = props;

    const hydratedProps = useMemo(
      () => ({
        metadata: metadata as ChartPanelMetadata,
        localDashboardId,
        makeModel: () => {
          if (metadata == null) {
            throw new Error('Metadata is required for chart panel');
          }

          return createChartModel(
            dh,
            chartTheme,
            connection,
            metadata as ChartPanelMetadata,
            fetch as unknown as () => Promise<Figure>,
            panelState
          );
        },
      }),
      [
        dh,
        connection,
        fetch,
        panelState,
        metadata,
        localDashboardId,
        chartTheme,
      ]
    );

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <ConnectedChartPanel ref={ref} {...props} {...hydratedProps} />;
  }
);

ChartPanelPlugin.displayName = 'ChartPanelPlugin';
