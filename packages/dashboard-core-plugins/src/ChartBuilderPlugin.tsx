import { useCallback } from 'react';
import {
  ChartModelFactory,
  ChartModelSettings,
  ChartUtils,
} from '@deephaven/chart';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Table } from '@deephaven/jsapi-types';
import shortid from 'shortid';
import { IrisGridEvent } from './events';
import { ChartPanel } from './panels';

export type ChartBuilderPluginProps = Partial<DashboardPluginComponentProps>;

/**
 * Listens for IrisGridEvent.CREATE_CHART and creates a chart from the settings provided
 * Requires the GridPlugin and ChartPlugin plugins to be loaded as well
 */
export function ChartBuilderPlugin(
  props: ChartBuilderPluginProps
): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const { id, layout } = props;
  const dh = useApi();
  const handleCreateChart = useCallback(
    ({
      metadata,
      panelId = shortid.generate(),
      table,
    }: {
      metadata: {
        settings: ChartModelSettings;
        sourcePanelId: string;
        table: string;
      };
      panelId?: string;
      table: Table;
    }) => {
      const { settings } = metadata;
      const makeModel = () =>
        ChartModelFactory.makeModelFromSettings(dh, settings, table);
      const title = ChartUtils.titleFromSettings(settings);

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
      LayoutUtils.openComponent({ root, config });
    },
    [dh, id, layout]
  );

  useListener(layout.eventHub, IrisGridEvent.CREATE_CHART, handleCreateChart);

  return null;
}

export default ChartBuilderPlugin;
