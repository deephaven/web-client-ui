import React, { DragEvent, useCallback, useEffect } from 'react';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  DashboardUtils,
  LayoutUtils,
  PanelHydrateFunction,
  useListener,
} from '@deephaven/dashboard';
import { IrisGridModel } from '@deephaven/iris-grid';
import shortid from 'shortid';
import { PandasPanel } from './panels';
import { PandasEvent } from './events';

export type PandasPluginProps = Partial<DashboardPluginComponentProps> & {
  hydrate: PanelHydrateFunction;
};

export const PandasPlugin = (props: PandasPluginProps): JSX.Element => {
  assertIsDashboardPluginProps(props);
  const {
    hydrate = DashboardUtils.hydrate,
    id,
    layout,
    registerComponent,
  } = props;
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
        component: PandasPanel.COMPONENT,
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
      const config = { component: PandasPanel.COMPONENT, id: panelId };
      const { root } = layout;
      LayoutUtils.closeComponent(root, config);
    },
    [layout]
  );

  useEffect(() => {
    const cleanups = [
      registerComponent(PandasPanel.COMPONENT, PandasPanel, hydrate),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [hydrate, registerComponent]);

  useListener(layout.eventHub, PandasEvent.OPEN, handleOpen);
  useListener(layout.eventHub, PandasEvent.CLOSE, handleClose);

  return <></>;
};

export default PandasPlugin;
