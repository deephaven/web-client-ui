import React, { DragEvent, useCallback, useEffect, useMemo } from 'react';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  PanelHydrateFunction,
  useListener,
} from '@deephaven/dashboard';
import { IrisGridModelFactory, IrisGridThemeType } from '@deephaven/iris-grid';
import { useApi } from '@deephaven/jsapi-bootstrap';
import type { Table, VariableDefinition } from '@deephaven/jsapi-types';
import shortid from 'shortid';
import { IrisGridPanel, IrisGridPanelProps, TablePlugin } from './panels';

export type GridPluginProps = Partial<DashboardPluginComponentProps> & {
  getDownloadWorker?: () => Promise<ServiceWorker>;
  loadPlugin?: (name: string) => TablePlugin;
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
  const dh = useApi();
  const supportedTypes: string[] = useMemo(
    () => [
      dh.VariableType.TABLE,
      dh.VariableType.TREETABLE,
      dh.VariableType.HIERARCHICALTABLE,
    ],
    [dh]
  );
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
      if (!supportedTypes.includes(type)) {
        return;
      }
      const metadata = { name, table: name, type: widget.type };
      const makeModel = () =>
        fetch().then((table: Table) =>
          IrisGridModelFactory.makeModel(dh, table)
        );
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
    [dh, getDownloadWorker, id, layout, loadPlugin, supportedTypes, theme]
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
