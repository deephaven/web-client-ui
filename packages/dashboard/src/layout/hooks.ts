import { ComponentType, DragEvent, useCallback, useEffect } from 'react';
import shortid from 'shortid';
import GoldenLayout from '@deephaven/golden-layout';
import { VariableDefinition } from '@deephaven/jsapi-shim';
import {
  DashboardPluginComponentProps,
  PanelComponentType,
  PanelDehydrateFunction,
  PanelHydrateFunction,
  PanelProps,
} from '../DashboardPlugin';
import PanelEvent from '../PanelEvent';
import LayoutUtils from './LayoutUtils';

export const useListener = (
  eventEmitter: GoldenLayout.EventEmitter,
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function
): void =>
  useEffect(() => {
    eventEmitter.on(eventName, callback);

    return () => {
      eventEmitter.off(eventName, callback);
    };
  }, [eventEmitter, eventName, callback]);

/**
 * Register a component that opens when a specified widget type is triggered with the PanelEvent.OPEN
 * @param dashboardPluginProps The dashboard plugin props
 * @param componentName Name the component should be registered under
 * @param componentType ComponentType to register
 * @param openType Specify which widget types this component should open for. Can either provide a string to match, or a function returning a bool.
 * @param hydrate Custom hydration function for the component
 * @param dehydrate Custom dehydration function for the component
 */
export const useWidget = <P extends PanelProps, C extends ComponentType<P>>(
  dashboardPluginProps: DashboardPluginComponentProps,
  componentName: string,
  componentType: PanelComponentType<P, C>,
  openType: string | ((widget: VariableDefinition) => boolean),
  hydrate?: PanelHydrateFunction,
  dehydrate?: PanelDehydrateFunction
): void => {
  const { id, layout, registerComponent } = dashboardPluginProps;
  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      fetch,
      panelId = shortid.generate(),
      widget,
    }: {
      dragEvent: DragEvent;
      fetch: () => Promise<unknown>;
      panelId?: string;
      widget: VariableDefinition;
    }) => {
      const { name, type } = widget;
      if (typeof openType === 'string') {
        if (openType !== type) {
          return;
        }
      } else if (!openType(widget)) {
        return;
      }
      const metadata = { name, type };
      const config = {
        type: 'react-component',
        component: componentName,
        props: {
          localDashboardId: id,
          id: panelId,
          metadata,
          fetch,
        },
        title: name,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [componentName, id, layout, openType]
  );

  useEffect(() => {
    const cleanups = [
      registerComponent(componentName, componentType, hydrate, dehydrate),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [componentName, componentType, dehydrate, hydrate, registerComponent]);

  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);
};

export default { useListener };
