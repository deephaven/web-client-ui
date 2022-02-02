import React, { DragEvent, useCallback, useEffect } from 'react';
import { ChartModel } from '@deephaven/chart';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelHydrateFunction,
  useListener,
} from '@deephaven/dashboard';
import shortid from 'shortid';
import { ChartPanel } from './panels';
import { ChartEvent } from './events';

export type ChartPluginProps = Partial<DashboardPluginComponentProps> & {
  hydrate: PanelHydrateFunction;
};

export const ChartPlugin = (props: ChartPluginProps): JSX.Element => {
  assertIsDashboardPluginProps(props);
  const { id, layout, registerComponent, hydrate } = props;
  const handleOpen = useCallback(
    (
      title: string,
      makeModel: () => ChartModel,
      metadata: Record<string, unknown> = {},
      panelId = shortid.generate(),
      dragEvent?: DragEvent
    ) => {
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
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [id, layout]
  );

  const handleClose = useCallback(
    (panelId: string) => {
      const config = { component: ChartPanel.COMPONENT, id: panelId };
      const { root } = layout;
      LayoutUtils.closeComponent(root, config);
    },
    [layout]
  );

  useEffect(() => {
    const cleanups = [
      registerComponent(ChartPanel.COMPONENT, ChartPanel, hydrate),
    ];
    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [hydrate, registerComponent]);

  useListener(layout.eventHub, ChartEvent.OPEN, handleOpen);
  useListener(layout.eventHub, ChartEvent.CLOSE, handleClose);

  return <></>;
};

export default ChartPlugin;
