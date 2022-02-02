import React, { DragEvent, useCallback, useEffect } from 'react';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelHydrateFunction,
  useListener,
} from '@deephaven/dashboard';
import { IrisGridModel, IrisGridThemeType } from '@deephaven/iris-grid';
import shortid from 'shortid';
import { IrisGridPanel } from './panels';
import { IrisGridEvent } from './events';

export type GridPluginProps = Partial<DashboardPluginComponentProps> & {
  getDownloadWorker?: () => Promise<ServiceWorker>;
  loadPlugin?: (name: string) => ReturnType<typeof React.forwardRef>;
  hydrate: PanelHydrateFunction;
  theme?: Partial<IrisGridThemeType>;
};

export const GridPlugin = (props: GridPluginProps): JSX.Element => {
  assertIsDashboardPluginProps(props);
  const {
    getDownloadWorker,
    loadPlugin,
    id,
    layout,
    registerComponent,
    hydrate,
    theme,
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
        component: IrisGridPanel.COMPONENT,
        props: {
          getDownloadWorker,
          loadPlugin,
          localDashboardId: id,
          id: panelId,
          metadata,
          makeModel,
          theme,
        },
        title,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [getDownloadWorker, id, layout, loadPlugin, theme]
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
      registerComponent(IrisGridPanel.COMPONENT, IrisGridPanel, hydrate),
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
