import React, { useCallback, useEffect } from 'react';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
  useListener,
} from '@deephaven/dashboard';
import { ServerWidgetPanel } from './panels';
import { ServerWidgetEvent } from './events';

export const ServerWidgetsPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const handleOpen = useCallback(
    ({
      name = '',
      makeModel,
      metadata = {},
      id: panelId = shortid.generate(),
      dragEvent,
    }: {
      name: string;
      makeModel: () => Promise<unknown>;
      metadata: Record<string, unknown>;
      id: string;
      dragEvent?: DragEvent;
    }) => {
      const config = {
        type: 'react-component',
        component: ServerWidgetPanel.COMPONENT,
        props: {
          localDashboardId: id,
          id: panelId,
          metadata,
          makeModel,
        },
        title: name,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [id, layout]
  );

  useEffect(() => {
    const cleanups = [
      registerComponent(ServerWidgetPanel.COMPONENT, ServerWidgetPanel),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  useListener(layout.eventHub, ServerWidgetEvent.OPEN, handleOpen);

  return <></>;
};

export default ServerWidgetsPlugin;
