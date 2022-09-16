import React, { useCallback } from 'react';
import { ChartModelFactory, ChartUtils } from '@deephaven/chart';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import { SeriesPlotStyle, Table } from '@deephaven/jsapi-shim';
import shortid from 'shortid';
import { IrisGridEvent } from './events';
import { ChartPanel } from './panels';

export type ChartBuilderPluginProps = Partial<DashboardPluginComponentProps>;

/**
 * Listens for IrisGridEvent.CREATE_CHART and creates a chart from the settings provided
 * Requires the GridPlugin and ChartPlugin plugins to be  loaded as well
 */
export const ChartBuilderPlugin = (
  props: ChartBuilderPluginProps
): JSX.Element => {
  assertIsDashboardPluginProps(props);
  const { id, layout } = props;
  const handleCreateChart = useCallback(
    ({
      metadata,
      panelId = shortid.generate(),
      table,
    }: {
      metadata: {
        settings: {
          type: keyof SeriesPlotStyle;
          series: string[];
          xAxis: string;
          isLinked: boolean;
          hiddenSeries?: string[];
        };
        sourcePanelId: string;
        table: string;
        tableSettings: Record<string, unknown>;
      };
      panelId?: string;
      table: Table;
    }) => {
      const { settings } = metadata;
      const makeModel = () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ChartModelFactory.makeModelFromSettings(settings as any, table);
      const title = ChartUtils.titleFromSettings(settings);

      const config = {
        type: 'react-component',
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
    [id, layout]
  );

  useListener(layout.eventHub, IrisGridEvent.CREATE_CHART, handleCreateChart);

  return <></>;
};

export default ChartBuilderPlugin;
