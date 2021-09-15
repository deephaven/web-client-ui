import React, { ComponentType, DragEvent, useCallback, useEffect } from 'react';
import { ChartModel } from '@deephaven/chart';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
} from '@deephaven/dashboard';
import shortid from 'shortid';
import { ChartPanel } from './panels';
import { ChartEvent } from './events';

export const ChartPlugin = ({
  id,
  layout,
  registerComponent,
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
        (ChartPanel as unknown) as ComponentType
      ),
    ];
    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  useEffect(() => {
    layout.eventHub.on(ChartEvent.OPEN, handleOpen);
    layout.eventHub.on(ChartEvent.CLOSE, handleClose);
    return () => {
      layout.eventHub.off(ChartEvent.OPEN, handleOpen);
      layout.eventHub.off(ChartEvent.CLOSE, handleClose);
    };
  }, [handleClose, handleOpen, layout]);

  return <></>;
};

export default ChartPlugin;
