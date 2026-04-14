import { useMemo } from 'react';
import Log from '@deephaven/log';
import usePlugins from './usePlugins';
import {
  isWidgetPlugin,
  isWidgetMiddlewarePlugin,
  type WidgetPlugin,
  type WidgetMiddlewarePlugin,
} from './PluginTypes';
import { createChainedComponent } from './PluginUtils';

const log = Log.module('@deephaven/plugin.WidgetView');

export type WidgetViewProps = {
  /** Fetch function to return the widget */
  fetch: () => Promise<unknown>;

  /** Type of the widget */
  type: string;
};

export function WidgetView({ fetch, type }: WidgetViewProps): JSX.Element {
  const plugins = usePlugins();

  const { basePlugin, middleware } = useMemo(() => {
    let foundBasePlugin: WidgetPlugin | undefined;
    const foundMiddleware: WidgetMiddlewarePlugin[] = [];

    [...plugins.values()].filter(isWidgetPlugin).forEach(p => {
      const supportsType = [p.supportedTypes].flat().includes(type);
      if (!supportsType) {
        return;
      }

      if (isWidgetMiddlewarePlugin(p)) {
        foundMiddleware.push(p);
      } else {
        if (foundBasePlugin != null) {
          log.warn(
            `Multiple base plugins for type ${type}. Replacing ${foundBasePlugin.name} with ${p.name}`
          );
        }
        foundBasePlugin = p;
      }
    });

    return { basePlugin: foundBasePlugin, middleware: foundMiddleware };
  }, [plugins, type]);

  const ChainedComponent = useMemo(() => {
    if (basePlugin == null) {
      return null;
    }
    return createChainedComponent(basePlugin.component, middleware);
  }, [basePlugin, middleware]);

  if (ChainedComponent != null) {
    return <ChainedComponent fetch={fetch} />;
  }

  throw new Error(`Unknown widget type '${type}'`);
}

export default WidgetView;
