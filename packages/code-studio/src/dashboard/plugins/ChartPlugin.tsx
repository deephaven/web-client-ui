import React, { ComponentType, DragEvent, useCallback, useEffect } from 'react';
import { ChartModel } from '@deephaven/chart';
import {
  DashboardPluginComponentProps,
  DashboardUtils,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import shortid from 'shortid';
import { ChartPanel } from './panels';
import { ChartEvent } from './events';

export const ChartPlugin = ({
  id,
  layout,
  registerComponent,
  hydrate = DashboardUtils.hydrate,
}: DashboardPluginComponentProps): JSX.Element => {
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
      registerComponent(
        ChartPanel.COMPONENT,
        (ChartPanel as unknown) as ComponentType,
        hydrate
      ),
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
