import React, { useCallback, useEffect } from 'react';
import { PlotlyChartModel } from '@deephaven/chart';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  LayoutUtils,
  PanelEvent,
  PanelHydrateFunction,
  useListener,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import { Figure, VariableDefinition } from '@deephaven/jsapi-shim';
import shortid from 'shortid';
import { ChartPanel } from './panels';

const log = Log.module('PlotlyChartPlugin');

const PANEL_COMPONENT = 'PlotlyChartPanel';

const PLOTLY_WIDGET_TYPE = 'plotly.figure';

export type JsWidget = {
  type: string;
  getDataAsBase64: () => string;
};

export type PlotlyChartPluginProps = Partial<DashboardPluginComponentProps> & {
  hydrate: PanelHydrateFunction;
};

export const PlotlyChartPlugin = (
  props: PlotlyChartPluginProps
): JSX.Element => {
  assertIsDashboardPluginProps(props);
  const { id, layout, registerComponent, hydrate } = props;
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

      if ((type as string) !== PLOTLY_WIDGET_TYPE) {
        return;
      }

      const makeModel = async () => {
        const resolved = ((await fetch()) as unknown) as JsWidget;
        const dataBase64 = resolved.getDataAsBase64();
        try {
          const json = JSON.parse(atob(dataBase64));
          return new PlotlyChartModel(json);
        } catch (e) {
          log.error(e);
          throw new Error('Unable to parse plot JSON');
        }
      };

      const metadata = { name, figure: name };

      const config = {
        type: 'react-component',
        component: PANEL_COMPONENT,
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

  useEffect(
    function registerComponentsAndReturnCleanup() {
      const cleanups = [
        registerComponent(PANEL_COMPONENT, ChartPanel, hydrate),
      ];
      return () => {
        cleanups.forEach(cleanup => cleanup());
      };
    },
    [hydrate, registerComponent]
  );

  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);

  return <></>;
};

export default PlotlyChartPlugin;
