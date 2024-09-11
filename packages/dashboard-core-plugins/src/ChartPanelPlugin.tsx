import { forwardRef, useCallback } from 'react';
import { useDeferredApi } from '@deephaven/jsapi-bootstrap';
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
  let settings = {};
  let tableName = '';
  let tableSettings = {};

  if (isChartPanelTableMetadata(metadata)) {
    settings = metadata.settings;
    tableName = metadata.table;
    tableSettings = metadata.tableSettings;
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
    const panelState = isChartPanelDehydratedProps(props)
      ? (props as unknown as ChartPanelProps).panelState
      : undefined;

    const { fetch: panelFetch, metadata, localDashboardId } = props;
    assertNotNull(metadata);
    const [dh, error] = useDeferredApi(metadata);

    const makeModel = useCallback(async () => {
      if (error != null) {
        throw error;
      }
      if (dh == null) {
        return new Promise<ChartModel>(() => {
          // We don't have the API yet, just return an unresolved promise so it shows as loading
        });
      }
      return createChartModel(
        dh,
        metadata as ChartPanelMetadata,
        panelFetch,
        panelState
      );
    }, [dh, error, metadata, panelFetch, panelState]);

    return (
      <ConnectedChartPanel
        ref={ref}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        metadata={metadata}
        localDashboardId={localDashboardId}
        makeModel={makeModel}
      />
    );
  }
);

ChartPanelPlugin.displayName = 'ChartPanelPlugin';

export default ChartPanelPlugin;
