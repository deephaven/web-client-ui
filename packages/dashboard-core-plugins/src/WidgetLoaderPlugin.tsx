import {
  useMemo,
  useCallback,
  type ComponentType,
  useEffect,
  forwardRef,
  useState,
} from 'react';
import type { ReactComponentConfig } from '@deephaven/golden-layout';
import shortid from 'shortid';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  DehydratedDashboardPanelProps,
  PanelEvent,
  PanelOpenEventDetail,
  LayoutUtils,
  useListener,
  PanelProps,
  canHaveRef,
} from '@deephaven/dashboard';
import { usePlugins } from '@deephaven/app-utils';
import { isWidgetPlugin, type WidgetPlugin } from '@deephaven/plugin';
import Log from '@deephaven/log';
import { WidgetPanel } from './panels';

const log = Log.module('WidgetLoaderPlugin');

function wrapWidgetPlugin(plugin: WidgetPlugin) {
  function Wrapper(props: PanelProps, ref: React.ForwardedRef<unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const C = plugin.component as any;
    const { metadata } = props;
    const [componentPanel, setComponentPanel] = useState<ComponentType>();
    const refCallback = useCallback(
      (e: ComponentType) => {
        setComponentPanel(e);
        if (typeof ref === 'function') {
          ref(e);
        } else if (ref != null) {
          // eslint-disable-next-line no-param-reassign
          ref.current = e;
        }
      },
      [ref]
    );

    const hasRef = canHaveRef(C);

    return (
      <WidgetPanel
        widgetName={metadata?.name}
        widgetType={plugin.title}
        componentPanel={componentPanel}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
      >
        {hasRef ? (
          <C
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            ref={refCallback}
          />
        ) : (
          <C
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
          />
        )}
        )
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
  props: DashboardPluginComponentProps
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
      fetch,
      panelId = shortid.generate(),
      widget,
    }: PanelOpenEventDetail) => {
      const { id: widgetId, type } = widget;
      const name = widget.title ?? widget.name;
      const { component } = supportedTypes.get(type) ?? {};
      if (component == null) {
        return;
      }
      const metadata = { id: widgetId, name, type };
      const panelProps: DehydratedDashboardPanelProps & {
        fetch?: typeof fetch;
      } = {
        localDashboardId: id,
        metadata,
        fetch,
      };

      const config: ReactComponentConfig = {
        type: 'react-component',
        component: component.displayName ?? '',
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
    const deregisterFns = [...plugins.values()]
      .filter(isWidgetPlugin)
      .map(plugin => {
        const { panelComponent } = plugin;
        if (panelComponent == null) {
          return registerComponent(plugin.name, wrapWidgetPlugin(plugin));
        }
        return registerComponent(plugin.name, panelComponent);
      });

    return () => {
      deregisterFns.forEach(deregister => deregister());
    };
  });

  /**
   * Listen for panel open events so we know when to open a panel
   */
  useListener(layout.eventHub, PanelEvent.OPEN, handlePanelOpen);

  return null;
}

export default WidgetLoaderPlugin;
