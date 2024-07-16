import { useMemo, useCallback, useEffect, forwardRef } from 'react';
import type { ReactComponentConfig } from '@deephaven/golden-layout';
import { nanoid } from 'nanoid';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  DehydratedDashboardPanelProps,
  PanelOpenEventDetail,
  LayoutUtils,
  PanelProps,
  canHaveRef,
  usePanelOpenListener,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import {
  isWidgetPlugin,
  usePlugins,
  type WidgetPlugin,
} from '@deephaven/plugin';
import { WidgetPanel } from './panels';
import { WidgetPanelDescriptor } from './panels/WidgetPanelTypes';

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

    return (
      <WidgetPanel
        descriptor={panelDescriptor}
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
 * @param props Dashboard plugin props
 * @returns React element
 */
export function WidgetLoaderPlugin(
  props: Partial<DashboardPluginComponentProps>
): JSX.Element | null {
  const plugins = usePlugins();
  const supportedTypes = useMemo(() => {
    const typeMap = new Map<string, WidgetPlugin>();
    plugins.forEach(plugin => {
      if (!isWidgetPlugin(plugin)) {
        return;
      }

      [plugin.supportedTypes].flat().forEach(supportedType => {
        if (supportedType != null && supportedType !== '') {
          if (typeMap.has(supportedType)) {
            log.warn(
              `Multiple WidgetPlugins handling type ${supportedType}. Replacing ${typeMap.get(
                supportedType
              )?.name} with ${plugin.name} to handle ${supportedType}`
            );
          }
          typeMap.set(supportedType, plugin);
        }
      });
    });

    return typeMap;
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
      const plugin = type != null ? supportedTypes.get(type) : null;
      if (plugin == null) {
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
        component: plugin.name,
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
    const deregisterFns = [...new Set(supportedTypes.values())].map(plugin => {
      const { panelComponent } = plugin;
      if (panelComponent == null) {
        return registerComponent(plugin.name, WrapWidgetPlugin(plugin));
      }
      return registerComponent(plugin.name, panelComponent);
    });

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
