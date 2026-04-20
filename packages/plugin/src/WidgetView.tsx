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

    log.debug(
      `WidgetView resolved plugins for type ${type}:`,
      'base=',
      foundBasePlugin?.name ?? 'none',
      'middleware=',
      foundMiddleware.map(m => m.name)
    );

    return { basePlugin: foundBasePlugin, middleware: foundMiddleware };
  }, [plugins, type]);

  const ChainedComponent = useMemo(() => {
    if (basePlugin == null) {
      log.debug(`No base plugin found for widget type ${type}`);
      return null;
    }
    return createChainedComponent(basePlugin.component, middleware);
  }, [basePlugin, middleware, type]);

  if (ChainedComponent != null) {
    log.debug(
      `Rendering chained component for type ${type}:`,
      ChainedComponent.displayName ?? ChainedComponent.name
    );
    return <ChainedComponent fetch={fetch} />;
  }

  throw new Error(`Unknown widget type '${type}'`);
}

export default WidgetView;
