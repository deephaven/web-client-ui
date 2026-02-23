import React, { useCallback, useEffect } from 'react';
import {
  PluginType,
  type WidgetMiddlewarePlugin,
  type WidgetMiddlewareComponentProps,
  type WidgetMiddlewarePanelProps,
} from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';
import { Button } from '@deephaven/components';
import { vsGear } from '@deephaven/icons';
import {
  type TableOption,
  type TableOptionPanelProps,
  useTableOptionsHost,
  defaultTableOptionsRegistry,
} from '@deephaven/iris-grid';

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
  // Log when middleware is mounted (for debugging)
  useEffect(() => {
    log.debug('GridMiddleware (component) mounted');
    return () => {
      log.debug('GridMiddleware (component) unmounted');
    };
  }, []);

  // Pass through to the wrapped component
  // Middleware can add context providers, state, or modify props here
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Component {...props} />;
}

GridMiddleware.displayName = 'GridMiddleware';

/**
 * Custom option type for the middleware plugin.
 * Using a unique string to avoid conflicts with built-in option types.
 */
const MIDDLEWARE_OPTION_TYPE = 'middleware-custom-option';

/**
 * A sample configuration panel similar to SelectDistinctBuilder.
 * Demonstrates how middleware plugins can use the useTableOptionsHost hook
 * to access and modify grid state.
 */
function MiddlewareConfigPanel(_props: TableOptionPanelProps): JSX.Element {
  // Access the Table Options context for state and dispatch
  const { gridState, dispatch, closePanel } = useTableOptionsHost();
  const { model, selectDistinctColumns, customColumns } = gridState;

  const handleButtonClick = useCallback(() => {
    log.info('MiddlewareConfigPanel button clicked!');
    // eslint-disable-next-line no-console
    console.log('MiddlewareConfigPanel: Sample button clicked!');
    // eslint-disable-next-line no-console
    console.log('Current selectDistinctColumns:', selectDistinctColumns);
    // eslint-disable-next-line no-console
    console.log('Current customColumns:', customColumns);
  }, [selectDistinctColumns, customColumns]);

  const handleClearSelectDistinct = useCallback(() => {
    log.info('Clearing selectDistinctColumns');
    dispatch({ type: 'SET_SELECT_DISTINCT_COLUMNS', columns: [] });
    closePanel();
  }, [dispatch, closePanel]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: 0,
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        flexFlow: 'column',
      }}
    >
      <div
        style={{
          padding: '1rem',
          fontWeight: 500,
          textAlign: 'left',
        }}
      >
        Middleware Custom Option
      </div>

      <div
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div
          style={{ color: 'var(--dh-color-text-muted)', fontSize: 'smaller' }}
        >
          Columns: {model.columns?.length ?? 0}
        </div>
        <div
          style={{ color: 'var(--dh-color-text-muted)', fontSize: 'smaller' }}
        >
          Select Distinct:{' '}
          {selectDistinctColumns.length > 0
            ? selectDistinctColumns.join(', ')
            : 'None'}
        </div>
        <div
          style={{ color: 'var(--dh-color-text-muted)', fontSize: 'smaller' }}
        >
          Custom Columns:{' '}
          {customColumns.length > 0 ? customColumns.join(', ') : 'None'}
        </div>
      </div>

      <div
        style={{
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <Button kind="primary" onClick={handleButtonClick}>
          Log State to Console
        </Button>
        {selectDistinctColumns.length > 0 && (
          <Button kind="secondary" onClick={handleClearSelectDistinct}>
            Clear Select Distinct
          </Button>
        )}
      </div>

      <div
        style={{
          margin: '1rem',
          marginBottom: 'auto',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: '1rem',
        }}
      >
        <div
          style={{
            color: 'var(--dh-color-text-muted)',
            fontSize: 'smaller',
          }}
        >
          This panel demonstrates using the useTableOptionsHost hook to access
          and modify grid state from a plugin.
        </div>
      </div>
    </div>
  );
}

MiddlewareConfigPanel.displayName = 'MiddlewareConfigPanel';

/**
 * Middleware custom option registered with the Table Options registry.
 * This demonstrates how plugins can add custom options via the registry.
 */
const MiddlewareCustomOption: TableOption = {
  type: MIDDLEWARE_OPTION_TYPE,

  menuItem: {
    title: 'Middleware Custom Option',
    subtitle: 'Opens a configuration panel',
    icon: vsGear,
    // Show at top of menu
    order: -100,
    // Always available
    isAvailable: () => true,
  },

  Panel: MiddlewareConfigPanel,
};

// Register the option with the default registry
defaultTableOptionsRegistry.register(MiddlewareCustomOption);

/**
 * Panel middleware that wraps the GridPanelPlugin.
 * This is used when the base plugin has a panelComponent defined.
 */
function GridPanelMiddleware({
  Component,
  ...props
}: WidgetMiddlewarePanelProps<dh.Table>): JSX.Element {
  // Log when panel middleware is mounted (for debugging)
  useEffect(() => {
    log.debug('GridMiddleware (panel) mounted');
    return () => {
      log.debug('GridMiddleware (panel) unmounted');
    };
  }, []);

  // Simply pass through - registry handles the option
  return (
    <Component
      /* eslint-disable-next-line react/jsx-props-no-spreading */ {...props}
    />
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
