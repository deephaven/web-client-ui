import { forwardRef, useContext, useMemo } from 'react';
import { DeferredApiContext } from '@deephaven/jsapi-bootstrap';
import { ChartModel, ChartModelFactory } from '@deephaven/chart';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { IrisGridUtils } from '@deephaven/iris-grid';
import { getTimeZone, store } from '@deephaven/redux';
import { WidgetPanelProps } from '@deephaven/plugin';
import { assertNotNull } from '@deephaven/utils';
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
  dh: typeof DhType,
  metadata: ChartPanelMetadata,
  panelFetch: () => Promise<DhType.plot.Figure | DhType.Table>,
  panelState?: GLChartPanelState
): Promise<ChartModel> {
  let settings;
  let tableName;
  let tableSettings;

  if (isChartPanelTableMetadata(metadata)) {
    settings = metadata.settings;
    tableName = metadata.table;
    tableSettings = metadata.tableSettings;
  } else {
    settings = {};
    tableName = '';
    tableSettings = {};
  }
  if (panelState != null) {
    if (panelState.tableSettings != null) {
      tableSettings = panelState.tableSettings;
    }
    if (panelState.table != null) {
      tableName = panelState.table;
    }
    if (panelState.settings != null) {
      settings = {
        ...settings,
        ...panelState.settings,
      };
    }
  }

  if (tableName != null && tableName !== '') {
    const table = (await panelFetch()) as DhType.Table;
    new IrisGridUtils(dh).applyTableSettings(
      table,
      tableSettings,
      getTimeZone(store.getState())
    );

    return ChartModelFactory.makeModelFromSettings(dh, settings, table);
  }

  const figure = (await panelFetch()) as DhType.plot.Figure;

  return ChartModelFactory.makeModel(dh, settings, figure);
}

export const ChartPanelPlugin = forwardRef(
  (props: WidgetPanelProps<DhType.plot.Figure>, ref: React.Ref<ChartPanel>) => {
    const deferredApi = useContext(DeferredApiContext);

    const panelState = isChartPanelDehydratedProps(props)
      ? (props as unknown as ChartPanelProps).panelState
      : undefined;

    const { fetch: panelFetch, metadata, localDashboardId } = props;

    const hydratedProps = useMemo(
      () => ({
        metadata: metadata as ChartPanelMetadata,
        localDashboardId,
        makeModel: async () => {
          if (metadata == null) {
            throw new Error('Metadata is required for chart panel');
          }

          const dh =
            typeof deferredApi === 'function'
              ? await deferredApi(metadata)
              : deferredApi;

          assertNotNull(dh, `Cannot find API for metadata: ${metadata}`);

          return createChartModel(
            dh,
            metadata as ChartPanelMetadata,
            panelFetch,
            panelState
          );
        },
      }),
      [metadata, localDashboardId, deferredApi, panelFetch, panelState]
    );

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <ConnectedChartPanel ref={ref} {...props} {...hydratedProps} />;
  }
);

ChartPanelPlugin.displayName = 'ChartPanelPlugin';

export default ChartPanelPlugin;
