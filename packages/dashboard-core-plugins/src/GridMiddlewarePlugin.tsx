import { useEffect, useMemo } from 'react';
import {
  PluginType,
  type WidgetMiddlewarePlugin,
  type WidgetMiddlewareComponentProps,
  type WidgetMiddlewarePanelProps,
} from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

const log = Log.module('GridMiddlewarePlugin');

/**
 * Example middleware plugin that wraps the GridWidgetPlugin.
 * This demonstrates how middleware can intercept and enhance widget rendering.
 *
 * Middleware plugins:
 * - Must set `isMiddleware: true`
 * - Receive the wrapped component as `Component` prop
 * - Must render `Component` to continue the chain
 * - Are chained in registration order (first registered = outermost wrapper)
 */
function GridMiddleware({
  Component,
  ...props
}: WidgetMiddlewareComponentProps<dh.Table>): JSX.Element {
  // Log when middleware is mounted
  useEffect(() => {
    log.info('GridMiddleware (component) mounted - wrapping table widget', {
      componentName: Component.displayName ?? Component.name ?? 'Unknown',
      props: Object.keys(props),
    });

    return () => {
      log.info('GridMiddleware (component) unmounted');
    };
  }, [Component, props]);

  // Example: You could add context providers, additional state, or UI elements here
  const middlewareStyle = useMemo(
    () => ({
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      width: '100%',
    }),
    []
  );

  const middlewareMessageStyle = useMemo(
    () => ({
      padding: 10,
    }),
    []
  );

  return (
    <div style={middlewareStyle} data-testid="grid-middleware-wrapper">
      <div style={middlewareMessageStyle}>
        Middleware plugin wrapping widget
      </div>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </div>
  );
}

GridMiddleware.displayName = 'GridMiddleware';

/**
 * Panel middleware that wraps the GridPanelPlugin.
 * This is used when the base plugin has a panelComponent defined.
 */
function GridPanelMiddleware({
  Component,
  ...props
}: WidgetMiddlewarePanelProps<dh.Table>): JSX.Element {
  // Log when panel middleware is mounted
  useEffect(() => {
    log.info('GridMiddleware (panel) mounted - wrapping table panel', {
      componentName: Component.displayName ?? Component.name ?? 'Unknown',
      props: Object.keys(props),
    });

    return () => {
      log.info('GridMiddleware (panel) unmounted');
    };
  }, [Component, props]);

  // Example: You could add context providers, additional state, or UI elements here
  const middlewareStyle = useMemo(
    () => ({
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      width: '100%',
    }),
    []
  );

  const middlewareMessageStyle = useMemo(
    () => ({
      padding: 10,
    }),
    []
  );

  return (
    <div style={middlewareStyle} data-testid="grid-middleware-wrapper">
      <div style={middlewareMessageStyle}>Middleware plugin wrapping panel</div>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </div>
  );
}

GridPanelMiddleware.displayName = 'GridPanelMiddleware';

/**
 * Middleware plugin configuration for GridWidgetPlugin.
 * This plugin wraps the base grid widget and can be used to:
 * - Add custom Table Options menu items
 * - Inject additional context or state
 * - Add UI elements around the grid
 * - Intercept and modify props before they reach the grid
 *
 * Since GridPluginConfig has a panelComponent, we must also provide
 * a panelComponent to have our middleware applied.
 */
const GridMiddlewarePluginConfig: WidgetMiddlewarePlugin<dh.Table> = {
  name: '@deephaven/grid-middleware',
  title: 'Grid Middleware',
  type: PluginType.WIDGET_PLUGIN,
  component: GridMiddleware,
  panelComponent: GridPanelMiddleware,
  supportedTypes: [
    'Table',
    'TreeTable',
    'HierarchicalTable',
    'PartitionedTable',
  ],
  isMiddleware: true,
};

export { GridMiddleware, GridPanelMiddleware };
export default GridMiddlewarePluginConfig;
