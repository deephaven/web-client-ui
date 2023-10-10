import { useMemo, useCallback, type ComponentType, useEffect } from 'react';
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
} from '@deephaven/dashboard';
import { usePlugins } from '@deephaven/app-utils';
import { isWidgetPlugin } from '@deephaven/plugin';

export function WidgetLoaderPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  const plugins = usePlugins();
  const supportedTypes = useMemo(() => {
    const typeMap = new Map<string, ComponentType>();
    plugins.forEach(plugin => {
      if (!isWidgetPlugin(plugin)) {
        return;
      }

      [plugin.supportedTypes].flat().forEach(supportedType => {
        if (supportedType != null && supportedType !== '') {
          typeMap.set(supportedType, plugin.component);
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
      const component = supportedTypes.get(type);
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
      .map(plugin => registerComponent(plugin.name, plugin.component));

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
