import React, { useCallback, useEffect } from 'react';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  PanelHydrateFunction,
  useListener,
} from '@deephaven/dashboard';
import { IrisGridModelFactory } from '@deephaven/iris-grid';
import { Table } from '@deephaven/jsapi-shim';
import shortid from 'shortid';
import { PandasPanel } from './panels';

export type PandasPluginProps = Partial<DashboardPluginComponentProps> & {
  hydrate: PanelHydrateFunction;
};

export const PandasPlugin = (props: PandasPluginProps): JSX.Element => {
  assertIsDashboardPluginProps(props);
  const { hydrate, id, layout, registerComponent } = props;

  const handlePanelOpen = useCallback(
    ({ dragEvent, fetch, panelId = shortid.generate(), widget }) => {
      const { name, type } = widget;
      if (type !== dh.VariableType.PANDAS) {
        return;
      }

      const metadata = { name, table: name };
      const makeModel = () =>
        fetch().then((table: Table) => IrisGridModelFactory.makeModel(table));
      const config = {
        type: 'react-component',
        component: PandasPanel.COMPONENT,
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
      registerComponent(PandasPanel.COMPONENT, PandasPanel, hydrate),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [hydrate, registerComponent]);

  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);

  return <></>;
};

export default PandasPlugin;
