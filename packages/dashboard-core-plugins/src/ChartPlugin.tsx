import { DragEvent, useCallback, useEffect } from 'react';
import { ChartModelFactory } from '@deephaven/chart';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  PanelHydrateFunction,
  useListener,
} from '@deephaven/dashboard';
import type { Figure, VariableDefinition } from '@deephaven/jsapi-types';
import { useApi } from '@deephaven/jsapi-bootstrap';
import shortid from 'shortid';
import { ChartPanel, ChartPanelProps } from './panels';

export type ChartPluginProps = Partial<DashboardPluginComponentProps> & {
  hydrate: PanelHydrateFunction<ChartPanelProps>;
};

export function ChartPlugin(props: ChartPluginProps): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const { id, layout, registerComponent, hydrate } = props;

  const dh = useApi();

  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      fetch,
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent?: DragEvent;
      fetch: () => Promise<Figure>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { name, type } = widget;
      if (type !== dh.VariableType.FIGURE) {
        return;
      }

      const metadata = { name, figure: name };
      const makeModel = () =>
        fetch().then((figure: Figure) =>
          ChartModelFactory.makeModel(dh, undefined, figure)
        );
      const config = {
        type: 'react-component' as const,
        component: ChartPanel.COMPONENT,
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
    [dh, id, layout]
  );

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        registerComponent(
          ChartPanel.COMPONENT,
          ChartPanel,
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

export default ChartPlugin;
