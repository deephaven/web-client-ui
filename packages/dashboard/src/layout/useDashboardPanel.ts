import { ComponentType, useCallback } from 'react';
import type { ReactComponentConfig } from '@deephaven/golden-layout';
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
import LayoutUtils from './LayoutUtils';
import useListener from './useListener';
import usePanelRegistration from './usePanelRegistration';

/**
 * Register a panel that will be opened when one of the `supportedTypes` objects is triggered.
 */
export function useDashboardPanel<
  P extends DashboardPanelProps,
  C extends ComponentType<P>,
>({
  dashboardProps,
  componentName,
  component,
  supportedTypes,
  hydrate,
  dehydrate,
}: {
  /** Props from the dashboard this panel is being registered in */
  dashboardProps: DashboardPluginComponentProps;

  /** Name of the component to register */
  componentName: string;

  /** Component type to register */
  component: PanelComponentType<P, C>;

  /** Names of the supported variable types this panel opens for */
  supportedTypes: string | string[];

  /** Custom hydration function to call when opening a panel */
  hydrate?: PanelHydrateFunction;

  /** Custom dehydration function to call when saving a panel's state to the layout */
  dehydrate?: PanelDehydrateFunction;
}): void {
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
        (Array.isArray(supportedTypes) && supportedTypes.includes(type)) ||
        type === supportedTypes;
      if (!isSupportedType) {
        // Only want to listen for your custom variable types
        return;
      }
      const metadata = { id: widgetId, name, type };
      let props: DehydratedDashboardPanelProps & { fetch?: typeof fetch } = {
        localDashboardId: id,
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
    [componentName, hydrate, id, layout, supportedTypes]
  );

  /**
   * Register our custom component type so the layout know hows to open it
   */
  usePanelRegistration(registerComponent, component, hydrate, dehydrate);

  /**
   * Listen for panel open events so we know when to open a panel
   */
  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);
}

export default useDashboardPanel;
