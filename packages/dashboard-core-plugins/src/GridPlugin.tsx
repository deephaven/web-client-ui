import React, { ComponentType, DragEvent, useCallback, useEffect } from 'react';
import {
  DashboardPluginComponentProps,
  DashboardUtils,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import { IrisGridModel } from '@deephaven/iris-grid';
import shortid from 'shortid';
import { IrisGridPanel } from './panels';
import { IrisGridEvent } from './events';

export const GridPlugin = ({
  id,
  layout,
  registerComponent,
  hydrate = DashboardUtils.hydrate,
}: DashboardPluginComponentProps): JSX.Element => {
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
        hydrate
      ),
    ];
    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [hydrate, registerComponent]);

  useListener(layout.eventHub, IrisGridEvent.OPEN_GRID, handleOpen);
  useListener(layout.eventHub, IrisGridEvent.CLOSE_GRID, handleClose);

  return <></>;
};

export default GridPlugin;
