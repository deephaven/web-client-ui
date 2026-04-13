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
  isWidgetPlugin,
  isWidgetMiddlewarePlugin,
  createChainedComponent,
  usePlugins,
  type WidgetPlugin,
  type WidgetMiddlewarePlugin,
  type WidgetPanelProps,
  type WidgetMiddlewarePanelProps,
} from '@deephaven/plugin';
import { WidgetPanel } from './panels';
import { type WidgetPanelDescriptor } from './panels/WidgetPanelTypes';

const log = Log.module('WidgetLoaderPlugin');

/**
 * Information about a widget type including its base plugin and any middleware.
 */
interface WidgetTypeInfo {
  /** The base plugin that handles this widget type, or null if only middleware registered so far */
  basePlugin: WidgetPlugin | null;
  /** Middleware plugins to apply, in order from outermost to innermost */
  middleware: WidgetMiddlewarePlugin[];
}

/**
 * Creates a panel component that chains middleware around a base panel component.
 * Each middleware panel wraps the next, with the base panel at the innermost layer.
 */
function createChainedPanelComponent<T>(
  basePanelComponent: React.ComponentType<WidgetPanelProps<T>>,
  middleware: WidgetMiddlewarePlugin<T>[]
): React.ComponentType<WidgetPanelProps<T>> {
  // Filter to middleware that has a panelComponent and extract just the panel components
  type MiddlewareWithPanel = WidgetMiddlewarePlugin<T> & {
    panelComponent: React.ComponentType<WidgetMiddlewarePanelProps<T>>;
  };
  const panelMiddleware = middleware.filter(
    (m): m is MiddlewareWithPanel => m.panelComponent != null
  );

  if (panelMiddleware.length === 0) {
    return basePanelComponent;
  }

  // Build the chain from inside out (base panel is innermost)
  return [...panelMiddleware]
    .reverse()
    .reduce<React.ComponentType<WidgetPanelProps<T>>>(
      (WrappedPanel, middlewarePlugin) => {
        const { panelComponent: MiddlewarePanelComponent } = middlewarePlugin;

        function ChainedPanel(props: WidgetPanelProps<T>) {
          return (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <MiddlewarePanelComponent {...props} Component={WrappedPanel} />
          );
        }
        ChainedPanel.displayName = `${middlewarePlugin.name}Panel(${
          (WrappedPanel as React.ComponentType).displayName ??
          (WrappedPanel as React.ComponentType).name ??
          'Panel'
        })`;
        return ChainedPanel;
      },
      basePanelComponent
    );
}

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

  /**
   * Build a map of widget types to their plugin chain info.
   * For each type, we have a base plugin and a list of middleware to apply.
   */
  const supportedTypes = useMemo(() => {
    const typeMap = new Map<string, WidgetTypeInfo>();

    plugins.forEach(plugin => {
      if (!isWidgetPlugin(plugin)) {
        return;
      }

      const isMiddleware = isWidgetMiddlewarePlugin(plugin);

      [plugin.supportedTypes].flat().forEach(supportedType => {
        if (supportedType == null || supportedType === '') {
          return;
        }

        const existing = typeMap.get(supportedType);

        if (isMiddleware) {
          // Add middleware to existing chain or create pending chain
          if (existing != null) {
            existing.middleware.push(plugin);
            log.debug(
              `Adding middleware ${plugin.name} to chain for type ${supportedType}`
            );
          } else {
            // No base plugin yet, create entry with just middleware
            // The base plugin will be set when a non-middleware plugin is registered
            typeMap.set(supportedType, {
              basePlugin: null,
              middleware: [plugin],
            });
            log.debug(
              `Creating pending middleware chain for type ${supportedType} with ${plugin.name}`
            );
          }
        } else {
          // Non-middleware plugin: becomes the base plugin
          if (existing != null) {
            if (existing.basePlugin != null) {
              // Already have a base plugin, warn about replacement
              log.warn(
                `Multiple WidgetPlugins handling type ${supportedType}. ` +
                  `Replacing ${existing.basePlugin.name} with ${plugin.name} as base plugin`
              );
            }
            // Keep existing middleware, update the base plugin
            existing.basePlugin = plugin;
          } else {
            typeMap.set(supportedType, {
              basePlugin: plugin,
              middleware: [],
            });
          }
          log.debug(`Set base plugin ${plugin.name} for type ${supportedType}`);
        }
      });
    });

    // Filter out entries that only have middleware (no base plugin)
    const validEntries = new Map<
      string,
      WidgetTypeInfo & { basePlugin: WidgetPlugin }
    >();
    typeMap.forEach((info, type) => {
      if (info.basePlugin != null) {
        validEntries.set(
          type,
          info as WidgetTypeInfo & { basePlugin: WidgetPlugin }
        );
      } else {
        log.warn(
          `No base plugin found for type ${type}, middleware will not be applied`
        );
      }
    });

    return validEntries;
  }, [plugins]);

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
    // supportedTypes is already filtered to entries with non-null basePlugin
    type ValidWidgetTypeInfo = WidgetTypeInfo & { basePlugin: WidgetPlugin };
    const uniquePluginInfos = new Map<string, ValidWidgetTypeInfo>();
    supportedTypes.forEach((info, _type) => {
      // Use the base plugin name as the key to get unique plugins
      if (!uniquePluginInfos.has(info.basePlugin.name)) {
        uniquePluginInfos.set(info.basePlugin.name, info);
      } else {
        // Merge middleware from multiple type registrations for the same base plugin
        const existingInfo = uniquePluginInfos.get(info.basePlugin.name);
        if (existingInfo != null) {
          info.middleware.forEach(m => {
            if (!existingInfo.middleware.includes(m)) {
              existingInfo.middleware.push(m);
            }
          });
        }
      }
    });

    const deregisterFns = [...uniquePluginInfos.values()].map(
      ({ basePlugin, middleware }) => {
        const { panelComponent } = basePlugin;

        if (panelComponent == null) {
          // No panel component - chain the widget components and wrap in default panel
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

        // Has panel component - chain both component and panel
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
