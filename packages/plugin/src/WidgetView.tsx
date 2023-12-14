import React, { useMemo } from 'react';
import usePlugins from './usePlugins';
import { isWidgetPlugin } from './PluginTypes';

export type WidgetViewProps = {
  /** Fetch function to return the widget */
  fetch: () => Promise<unknown>;

  /** Type of the widget */
  type: string;
};

export function WidgetView({ fetch, type }: WidgetViewProps): JSX.Element {
  const plugins = usePlugins();
  const plugin = useMemo(
    () =>
      [...plugins.values()]
        .filter(isWidgetPlugin)
        .find(p => [p.supportedTypes].flat().includes(type)),
    [plugins, type]
  );

  if (plugin != null) {
    const Component = plugin.component;
    return <Component fetch={fetch} />;
  }

  throw new Error(`Unknown widget type '${type}'`);
}

export default WidgetView;
