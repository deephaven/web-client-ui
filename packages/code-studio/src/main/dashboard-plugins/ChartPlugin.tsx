import React, { ComponentType, DragEvent, useCallback, useEffect } from 'react';
import { ChartModel } from '@deephaven/chart';
import shortid from 'shortid';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import { ChartPanel } from '../../dashboard/panels';
import { ChartEvent } from '../../dashboard/events';
import LayoutUtils from '../../layout/LayoutUtils';

export const ChartPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const hydrate = useCallback(
    props => ({
      ...props,
      localDashboardId: id,
    }),
    [id]
  );
  const dehydrate = useCallback(props => null, []);

  const registerComponents = useCallback(() => {
    registerComponent(
      ChartPanel.COMPONENT,
      (ChartPanel as unknown) as ComponentType,
      hydrate,
      dehydrate
    );
  }, [dehydrate, hydrate, registerComponent]);

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
        id,
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
    registerComponents();
  }, [registerComponents]);

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
