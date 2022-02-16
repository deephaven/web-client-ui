import React, { DragEvent, useCallback, useEffect } from 'react';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  PanelHydrateFunction,
  useListener,
} from '@deephaven/dashboard';
import { IrisGridModelFactory, IrisGridThemeType } from '@deephaven/iris-grid';
import { Table, VariableDefinition } from '@deephaven/jsapi-shim';
import shortid from 'shortid';
import { IrisGridPanel } from './panels';

export const SUPPORTED_TYPES: string[] = [
  dh.VariableType.TABLE,
  dh.VariableType.TREETABLE,
];

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
  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      fetch,
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent?: DragEvent;
      fetch: () => Promise<Table>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { name, type } = widget;
      if (!SUPPORTED_TYPES.includes(type)) {
        return;
      }

      const metadata = { name, table: name };
      const makeModel = () =>
        fetch().then((table: Table) => IrisGridModelFactory.makeModel(table));
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
        title: name,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [getDownloadWorker, id, layout, loadPlugin, theme]
  );

  useEffect(() => {
    const cleanups = [
      registerComponent(IrisGridPanel.COMPONENT, IrisGridPanel, hydrate),
    ];
    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [hydrate, registerComponent]);

  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);

  return <></>;
};

export default GridPlugin;
