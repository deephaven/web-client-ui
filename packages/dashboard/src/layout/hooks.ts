import { ComponentType, useCallback, useEffect } from 'react';
import type {
  EventEmitter,
  ReactComponentConfig,
} from '@deephaven/golden-layout';
import shortid from 'shortid';
import {
  DashboardPanelProps,
  DashboardPluginComponentProps,
  DehydratedDashboardPanelProps,
  PanelComponentType,
  PanelDehydrateFunction,
  PanelHydrateFunction,
} from '../DashboardPlugin';
import PanelEvent, { PanelOpenEventDetail } from '../PanelEvent';
import { LayoutUtils } from '.';

export function useListener(
  eventEmitter: EventEmitter,
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function
) {
  useEffect(
    function initEventEmitter() {
      eventEmitter.on(eventName, callback);

      return () => {
        eventEmitter.off(eventName, callback);
      };
    },
    [eventEmitter, eventName, callback]
  );
}

export function useComponent<
  P extends DashboardPanelProps,
  C extends ComponentType<P>
>(
  dashboardProps: DashboardPluginComponentProps,
  componentName: string,
  component: PanelComponentType<P, C>,
  variableName: string | string[],
  hydrate?: PanelHydrateFunction,
  dehydrate?: PanelDehydrateFunction
) {
  const { id, layout, registerComponent } = dashboardProps;

  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      fetch,
      panelId = shortid.generate(),
      widget,
    }: PanelOpenEventDetail) => {
      const { id: widgetId, type } = widget;
      const name = widget.title ?? widget.name;
      const isSupportedType =
        (Array.isArray(variableName) && variableName.includes(type)) ||
        type === variableName;
      if (!isSupportedType) {
        // Only want to listen for your custom variable types
        return;
      }
      const metadata = { id: widgetId, name, type };
      let props: DehydratedDashboardPanelProps & { fetch?: typeof fetch } = {
        localDashboardId: id,
        id: panelId,
        metadata,
        fetch,
      };
      if (hydrate != null) {
        props = hydrate(props, id);
      }
      const config: ReactComponentConfig = {
        type: 'react-component',
        component: componentName,
        props,
        title: name,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [componentName, hydrate, id, layout, variableName]
  );

  /**
   * Register our custom component type so the layout know hows to open it
   */
  useEffect(() => {
    const cleanups = [
      registerComponent(componentName, component, hydrate, dehydrate),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [component, componentName, dehydrate, hydrate, registerComponent]);

  /**
   * Listen for panel open events so we know when to open a panel
   */
  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);
}

export default { useComponent, useListener };
