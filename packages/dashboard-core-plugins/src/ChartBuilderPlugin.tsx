import { useCallback } from 'react';
import { type ChartModelSettings, ChartUtils } from '@deephaven/chart';
import {
  assertIsDashboardPluginProps,
  type DashboardPluginComponentProps,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import type { dh } from '@deephaven/jsapi-types';
import { nanoid } from 'nanoid';
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

  const handleCreateChart = useCallback(
    ({
      metadata,
      panelId = nanoid(),
      table,
    }: {
      metadata: {
        settings: ChartModelSettings;
        sourcePanelId: string;
        table: string;
      };
      panelId?: string;
      table: dh.Table;
    }) => {
      const { settings } = metadata;
      const fetchTable = async () => table;
      const title = ChartUtils.titleFromSettings(settings);

      const config = {
        type: 'react-component' as const,
        component: ChartPanel.COMPONENT,
        props: {
          localDashboardId: id,
          id: panelId,
          metadata,
          fetch: fetchTable,
        },
        title,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config });
    },
    [id, layout]
  );

  useListener(layout.eventHub, IrisGridEvent.CREATE_CHART, handleCreateChart);

  return null;
}

export default ChartBuilderPlugin;
