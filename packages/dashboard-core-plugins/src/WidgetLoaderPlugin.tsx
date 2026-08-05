import { useMemo, useCallback, useEffect, forwardRef } from 'react';
import type { ReactComponentConfig } from '@deephaven/golden-layout';
import { nanoid } from 'nanoid';
import {
  assertIsDashboardPluginProps,
  type DashboardPluginComponentProps,
  type DehydratedDashboardPanelProps,
  type PanelOpenEventDetail,
  LayoutUtils,
  type PanelProps,
  canHaveRef,
  usePanelOpenListener,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import {
  createChainedComponent,
  createChainedPanelComponent,
  usePlugins,
  type WidgetPlugin,
} from '@deephaven/plugin';
import { WidgetPanel } from './panels';
import { type WidgetPanelDescriptor } from './panels/WidgetPanelTypes';
import {
  getSupportedWidgetTypes,
  getUniqueWidgetPluginInfos,
} from './WidgetLoaderUtils';

const log = Log.module('WidgetLoaderPlugin');

export function WrapWidgetPlugin(
  plugin: WidgetPlugin
): React.ForwardRefExoticComponent<PanelProps & React.RefAttributes<unknown>> {
  function Wrapper(props: PanelProps, ref: React.ForwardedRef<unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const C = plugin.component as any;
    const { metadata } = props;

    const panelDescriptor: WidgetPanelDescriptor = {
      ...metadata,
      type: metadata?.type ?? plugin.type,
      name: metadata?.name ?? 'Widget',
    };

    const hasRef = canHaveRef(C);
    const className = `widget-loader-${panelDescriptor.type}`;

    return (
      <WidgetPanel
        descriptor={panelDescriptor}
        className={className}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      >
        {hasRef ? (
          <C
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            ref={ref}
          />
        ) : (
          <C
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
          />
        )}
      </WidgetPanel>
    );
  }

  Wrapper.displayName = `WidgetLoaderPlugin(${
    plugin.component.displayName ?? plugin.name
  })`;

  return forwardRef(Wrapper);
}

/**
 * Widget to automatically open any supported WidgetPlugin types as panels
 * if the widget is emitted from the server as the result of executed code.
 *
 * Does not open panels for widgets that are not supported by any plugins.
 * Does not open panels for widgets that are a component of a larger widget or UI element.
 *
 * Supports plugin chaining via middleware plugins. When multiple plugins
 * support the same widget type, middleware plugins are chained around
 * the base plugin in registration order.
 *
 * @param props Dashboard plugin props
 * @returns React element
 */
export function WidgetLoaderPlugin(
  props: Partial<DashboardPluginComponentProps>
): JSX.Element | null {
  const plugins = usePlugins();

  const supportedTypes = useMemo(
    () => getSupportedWidgetTypes(plugins),
    [plugins]
  );

  assertIsDashboardPluginProps(props);
  const { id, layout, registerComponent } = props;

  const handlePanelOpen = useCallback(
    ({
      dragEvent,
      panelId = nanoid(),
      fetch,
      widget,
    }: PanelOpenEventDetail) => {
      const { type } = widget;
      const typeInfo = type != null ? supportedTypes.get(type) : null;
      if (typeInfo == null) {
        return;
      }
      const name = widget.name ?? type;

      const panelProps: DehydratedDashboardPanelProps & {
        fetch?: () => Promise<unknown>;
      } = {
        localDashboardId: id,
        metadata: widget,
        fetch,
      };

      const config: ReactComponentConfig = {
        type: 'react-component',
        component: typeInfo.basePlugin.name,
        props: panelProps,
        title: name,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config, dragEvent });
    },
    [id, layout, supportedTypes]
  );

  useEffect(() => {
    // Get unique base plugins (a plugin may handle multiple types)
    const uniquePluginInfos = getUniqueWidgetPluginInfos(supportedTypes);

    log.debug(
      'Registering widget components',
      [...uniquePluginInfos.entries()].map(([name, info]) => ({
        plugin: name,
        middleware: info.middleware.map(m => m.name),
        hasPanel: info.basePlugin.panelComponent != null,
      }))
    );

    const deregisterFns = [...uniquePluginInfos.values()].map(
      ({ basePlugin, middleware }) => {
        const { panelComponent } = basePlugin;

        if (panelComponent == null) {
          // No panel component - chain the widget components and wrap in default panel
          log.debug(
            `Chaining widget components for ${basePlugin.name} (no panel component, using default wrapper)`
          );
          const chainedComponent = createChainedComponent(
            basePlugin.component,
            middleware
          );
          const wrappedPlugin: WidgetPlugin = {
            ...basePlugin,
            component: chainedComponent,
          };
          return registerComponent(
            basePlugin.name,
            WrapWidgetPlugin(wrappedPlugin)
          );
        }

        // Has panel component - chain middleware around the panel.
        // Only middleware that defines panelComponent is applied here.
        // Middleware with only component is skipped in this path.
        log.debug(
          `Chaining panel components for ${basePlugin.name} (has custom panel component)`
        );
        const chainedPanelComponent = createChainedPanelComponent(
          panelComponent,
          middleware
        );

        return registerComponent(basePlugin.name, chainedPanelComponent);
      }
    );

    return () => {
      deregisterFns.forEach(deregister => deregister());
    };
  }, [registerComponent, supportedTypes]);

  /**
   * Listen for panel open events so we know when to open a panel
   */
  usePanelOpenListener(layout.eventHub, handlePanelOpen);

  return null;
}

export default WidgetLoaderPlugin;
