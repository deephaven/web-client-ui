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
import { IrisGridPanel, IrisGridPanelProps } from './panels';

const SUPPORTED_TYPES: string[] = [
  dh.VariableType.TABLE,
  dh.VariableType.TREETABLE,
  dh.VariableType.HIERARCHICALTABLE,
];

export type GridPluginProps = Partial<DashboardPluginComponentProps> & {
  getDownloadWorker?: () => Promise<ServiceWorker>;
  loadPlugin?: (name: string) => ReturnType<typeof React.forwardRef>;
  hydrate: PanelHydrateFunction<IrisGridPanelProps>;
  theme?: Partial<IrisGridThemeType>;
};

export function GridPlugin(props: GridPluginProps): JSX.Element | null {
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

      const metadata = { name, table: name, type: widget.type };
      const makeModel = () =>
        fetch().then((table: Table) => IrisGridModelFactory.makeModel(table));
      const config = {
        type: 'react-component' as const,
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

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        registerComponent(
          IrisGridPanel.COMPONENT,
          IrisGridPanel,
          hydrate as PanelHydrateFunction
        ),
      ];
      return () => {
        cleanups.forEach(cleanup => cleanup());
      };
    },
    [hydrate, registerComponent]
  );

  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);

  return null;
}

export default GridPlugin;
