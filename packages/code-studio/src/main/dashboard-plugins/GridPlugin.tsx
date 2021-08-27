import React, { ComponentType, DragEvent, useCallback, useEffect } from 'react';
import { IrisGridModel } from '@deephaven/iris-grid';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  DeregisterComponentFn,
} from '../../dashboard/DashboardPlugin';
import { IrisGridPanel } from '../../dashboard/panels';
import { IrisGridEvent } from '../../dashboard/events';
import LayoutUtils from '../../layout/LayoutUtils';

export const GridPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const hydrateGrid = useCallback(
    props => ({
      ...props,
      localDashboardId: id,
      makeModel: async () => {
        throw new Error('Hydration not yet implemented.');
      },
    }),
    [id]
  );

  const handleOpen = useCallback(
    (
      title: string,
      makeModel: () => IrisGridModel,
      metadata: Record<string, unknown> = {},
      panelId = shortid.generate(),
      dragEvent?: DragEvent
    ) => {
      const config = {
        type: 'react-component',
        component: IrisGridPanel.COMPONENT,
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
      const config = { component: IrisGridPanel.COMPONENT, id: panelId };
      const { root } = layout;
      LayoutUtils.closeComponent(root, config);
    },
    [layout]
  );

  useEffect(() => {
    const cleanups = [
      registerComponent(
        IrisGridPanel.COMPONENT,
        (IrisGridPanel as unknown) as ComponentType,
        hydrateGrid
      ),
    ];
    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [hydrateGrid, registerComponent]);

  useEffect(() => {
    layout.eventHub.on(IrisGridEvent.OPEN_GRID, handleOpen);
    layout.eventHub.on(IrisGridEvent.CLOSE_GRID, handleClose);
    return () => {
      layout.eventHub.off(IrisGridEvent.OPEN_GRID, handleOpen);
      layout.eventHub.off(IrisGridEvent.CLOSE_GRID, handleClose);
    };
  }, [handleClose, handleOpen, layout]);

  return <></>;
};

export default GridPlugin;
