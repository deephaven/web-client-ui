import React, { useMemo } from 'react';
import usePlugins from './usePlugins';
import {
  isWidgetPlugin,
  isWidgetMiddlewarePlugin,
  type WidgetPlugin,
  type WidgetMiddlewarePlugin,
  type WidgetComponentProps,
} from './PluginTypes';

export type WidgetViewProps = {
  /** Fetch function to return the widget */
  fetch: () => Promise<unknown>;

  /** Type of the widget */
  type: string;
};

/**
 * Creates a component that chains middleware around a base component.
 * Each middleware wraps the next, with the base component at the innermost layer.
 */
function createChainedComponent<T>(
  baseComponent: React.ComponentType<WidgetComponentProps<T>>,
  middleware: WidgetMiddlewarePlugin<T>[]
): React.ComponentType<WidgetComponentProps<T>> {
  if (middleware.length === 0) {
    return baseComponent;
  }

  // Build the chain from inside out (base component is innermost)
  // Middleware is ordered outermost to innermost, so we reverse to build from inside out
  return [...middleware]
    .reverse()
    .reduce<React.ComponentType<WidgetComponentProps<T>>>(
      (WrappedComponent, middlewarePlugin) => {
        const MiddlewareComponent = middlewarePlugin.component;

        function ChainedComponent(props: WidgetComponentProps<T>) {
          return (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <MiddlewareComponent {...props} Component={WrappedComponent} />
          );
        }
        ChainedComponent.displayName = `${middlewarePlugin.name}(${
          (WrappedComponent as React.ComponentType).displayName ??
          (WrappedComponent as React.ComponentType).name ??
          'Component'
        })`;
        return ChainedComponent;
      },
      baseComponent
    );
}

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
      } else if (foundBasePlugin == null) {
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
