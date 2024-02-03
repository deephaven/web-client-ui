import { forwardRef, useMemo } from 'react';
import {
  ObjectFetcher,
  useApi,
  useObjectFetcher,
} from '@deephaven/jsapi-bootstrap';
import {
  ChartModel,
  ChartModelFactory,
  ChartTheme,
  useChartTheme,
} from '@deephaven/chart';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { IrisGridUtils } from '@deephaven/iris-grid';
import { getTimeZone, store } from '@deephaven/redux';
import { WidgetPanelProps } from '@deephaven/plugin';
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
  dh: typeof DhType,
  chartTheme: ChartTheme,
  fetchObject: ObjectFetcher,
  metadata: ChartPanelMetadata,
  fetchFigure: () => Promise<DhType.plot.Figure>,
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
    const figure = await fetchFigure();

    return ChartModelFactory.makeModel(dh, settings, figure, chartTheme);
  }

  if (figureName != null) {
    let figure: DhType.plot.Figure;

    if (metadata.type === dh.VariableType.FIGURE) {
      const descriptor = {
        name: figureName,
        type: dh.VariableType.FIGURE,
      };
      figure = await fetchObject<DhType.plot.Figure>(descriptor);
    } else {
      figure = await fetchFigure();
    }

    return ChartModelFactory.makeModel(dh, settings, figure, chartTheme);
  }

  const descriptor = {
    name: tableName,
    type: dh.VariableType.TABLE,
  };
  const table = await fetchObject<DhType.Table>(descriptor);
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

export const ChartPanelPlugin = forwardRef(
  (props: WidgetPanelProps<DhType.plot.Figure>, ref: React.Ref<ChartPanel>) => {
    const dh = useApi();
    const chartTheme = useChartTheme();
    const fetchObject = useObjectFetcher();

    const panelState = isChartPanelDehydratedProps(props)
      ? (props as unknown as ChartPanelProps).panelState
      : undefined;

    const { fetch: panelFetch, metadata, localDashboardId } = props;

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
            fetchObject,
            metadata as ChartPanelMetadata,
            panelFetch,
            panelState
          );
        },
      }),
      [
        metadata,
        localDashboardId,
        dh,
        chartTheme,
        fetchObject,
        panelFetch,
        panelState,
      ]
    );

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <ConnectedChartPanel ref={ref} {...props} {...hydratedProps} />;
  }
);

ChartPanelPlugin.displayName = 'ChartPanelPlugin';

export default ChartPanelPlugin;
