import React, { isValidElement } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getThemeKey, type ThemeData } from '@deephaven/components';
import { vsPreview } from '@deephaven/icons';
import Log from '@deephaven/log';
import {
  type PluginModule,
  isWidgetPlugin,
  type PluginModuleMap,
  type ThemePlugin,
  isThemePlugin,
  isElementPlugin,
  type ElementPlugin,
  type ElementMap,
  type WidgetMiddlewarePlugin,
  type WidgetMiddlewareComponentProps,
  type WidgetMiddlewarePanelProps,
  type WidgetComponentProps,
  type WidgetPanelProps,
  isLegacyPlugin,
  isMultiPlugin,
  isPlugin,
  type LegacyPlugin,
  type Plugin,
  type WidgetDashboardPlugin,
  isWidgetDashboardPlugin,
} from './PluginTypes';

const log = Log.module('@deephaven/plugin.PluginUtils');

/**
 * Get a display-friendly name for a React component.
 * Prefers displayName, falls back to name, then the provided fallback.
 */
function getComponentName(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>,
  fallback = 'Component'
): string {
  return component.displayName ?? component.name ?? fallback;
}

export function pluginSupportsType(
  plugin: PluginModule | undefined,
  type: string
): boolean {
  if (plugin == null || !isWidgetPlugin(plugin)) {
    return false;
  }

  return [plugin.supportedTypes].flat().some(t => t === type);
}

/**
 * Check if the given plugin supports opening a widget of the given type as a dashboard.
 * @param plugin Plugin to check
 * @param type Widget type
 * @returns True if plugin supports opening it as a dashboard
 */
export function pluginSupportsTypeAsDashboard(
  plugin: PluginModule | undefined,
  type: string
): boolean {
  if (plugin == null || !isWidgetDashboardPlugin(plugin)) {
    return false;
  }

  return [plugin.dashboardTypes].flat().some(t => t === type);
}

export function getIconForPlugin(plugin: PluginModule): React.ReactElement {
  const defaultIcon = <FontAwesomeIcon icon={vsPreview} />;
  if (!isWidgetPlugin(plugin)) {
    return defaultIcon;
  }

  const { icon } = plugin;

  if (icon == null) {
    return defaultIcon;
  }

  if (isValidElement(icon)) {
    return icon;
  }

  return <FontAwesomeIcon icon={icon} />;
}

/**
 * Extract theme data from theme plugins in the given plugin map.
 * @param pluginMap
 */
export function getThemeDataFromPlugins(
  pluginMap: PluginModuleMap
): ThemeData[] {
  const themePluginEntries = [...pluginMap.entries()].filter(
    (entry): entry is [string, ThemePlugin] => isThemePlugin(entry[1])
  );

  log.debug('Getting theme data from plugins', themePluginEntries);

  return themePluginEntries
    .map(([pluginName, plugin]) => {
      // Normalize to an array since config can be an array of configs or a
      // single config
      const configs = Array.isArray(plugin.themes)
        ? plugin.themes
        : [plugin.themes];

      return configs.map(
        ({ name, baseTheme, styleContent }) =>
          ({
            baseThemeKey: `default-${baseTheme ?? 'dark'}`,
            themeKey: getThemeKey(pluginName, name),
            name,
            styleContent,
          }) as const
      );
    })
    .flat();
}

/**
 * Get a mapping of element names to their React components from the given plugin map.
 * @param pluginMap The plugin map to extract element plugins from.
 * @returns A Map of element names to their React components.
 */
export function getPluginsElementMap(pluginMap: PluginModuleMap): ElementMap {
  const elementPluginEntries = [...pluginMap.entries()].filter(
    (entry): entry is [string, ElementPlugin] =>
      isElementPlugin(entry[1]) && entry[1].mapping != null
  );

  log.debug('Getting element plugin mapping', elementPluginEntries);

  return new Map(
    elementPluginEntries.flatMap(([, plugin]) => Object.entries(plugin.mapping))
  );
}

/**
 * Creates a component that chains middleware around a base component.
 * Each middleware wraps the next, with the base component at the innermost layer.
 */
export function createChainedComponent<T>(
  baseComponent: React.ComponentType<WidgetComponentProps<T>>,
  middleware: WidgetMiddlewarePlugin<T>[]
): React.ComponentType<WidgetComponentProps<T>> {
  if (middleware.length === 0) {
    log.debug(
      'No middleware to chain for component',
      getComponentName(baseComponent)
    );
    return baseComponent;
  }

  log.debug(
    'Chaining component middleware',
    getComponentName(baseComponent),
    middleware.map(m => m.name)
  );

  // Build the chain from inside out (base component is innermost)
  // Middleware is ordered outermost to innermost, so we reverse to build from inside out
  return [...middleware]
    .reverse()
    .reduce<React.ComponentType<WidgetComponentProps<T>>>(
      (WrappedComponent, middlewarePlugin) => {
        const MiddlewareComponent = middlewarePlugin.component;
        const supported = [middlewarePlugin.supportedTypes].flat();

        function ChainedComponent({
          metadata,
          ...rest
        }: WidgetComponentProps<T>) {
          // Skip middleware if the widget type doesn't match its supportedTypes
          if (metadata?.type != null && !supported.includes(metadata.type)) {
            // eslint-disable-next-line react/jsx-props-no-spreading
            return <WrappedComponent {...rest} metadata={metadata} />;
          }
          return (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <MiddlewareComponent
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...rest}
              metadata={metadata}
              Component={WrappedComponent}
            />
          );
        }
        ChainedComponent.displayName = `${
          middlewarePlugin.name
        }(${getComponentName(WrappedComponent)})`;
        return ChainedComponent;
      },
      baseComponent
    );
}

/**
 * Creates a panel component that chains middleware around a base panel component.
 * Each middleware panel wraps the next, with the base panel at the innermost layer.
 *
 * The chain forwards the `ref` injected by golden-layout (on the registered
 * panel) all the way down to `basePanelComponent`. Golden-layout uses that ref
 * to bind a class panel's React state into its serialized `componentState`;
 * forwarding it keeps that persistence working through transparent middleware,
 * so wrapped panels still restore sorts/filters/column moves on reload.
 */
export function createChainedPanelComponent<T>(
  basePanelComponent: React.ComponentType<WidgetPanelProps<T>>,
  middleware: WidgetMiddlewarePlugin<T>[]
): React.ComponentType<WidgetPanelProps<T>> {
  type RefCapablePanel = React.ForwardRefExoticComponent<
    WidgetPanelProps<T> & React.RefAttributes<unknown>
  >;

  // Filter to middleware that has a panelComponent and extract just the panel components
  type MiddlewareWithPanel = WidgetMiddlewarePlugin<T> & {
    panelComponent: NonNullable<WidgetMiddlewarePlugin<T>['panelComponent']>;
  };
  const panelMiddleware = middleware.filter(
    (m): m is MiddlewareWithPanel => m.panelComponent != null
  );

  if (panelMiddleware.length === 0) {
    log.debug(
      'No panel middleware to chain for panel component',
      getComponentName(basePanelComponent)
    );
    return basePanelComponent;
  }

  log.debug(
    'Chaining panel middleware',
    getComponentName(basePanelComponent),
    panelMiddleware.map(m => m.name)
  );

  // Build the chain from inside out (base panel is innermost)
  return [...panelMiddleware]
    .reverse()
    .reduce<RefCapablePanel>((WrappedPanel, middlewarePlugin) => {
      const MiddlewarePanelComponent = middlewarePlugin.panelComponent;
      const supported = [middlewarePlugin.supportedTypes].flat();

      const ChainedPanel = React.forwardRef<unknown, WidgetPanelProps<T>>(
        ({ metadata, ...rest }, ref) => {
          // Skip middleware if the widget type doesn't match its supportedTypes
          if (metadata?.type != null && !supported.includes(metadata.type)) {
            return (
              // eslint-disable-next-line react/jsx-props-no-spreading
              <WrappedPanel ref={ref} {...rest} metadata={metadata} />
            );
          }
          return (
            <MiddlewarePanelComponent
              ref={ref}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...rest}
              metadata={metadata}
              Component={WrappedPanel}
            />
          );
        }
      );
      ChainedPanel.displayName = `${
        middlewarePlugin.name
      }Panel(${getComponentName(WrappedPanel, 'Panel')})`;
      return ChainedPanel;
    }, basePanelComponent as RefCapablePanel);
}

/**
 * What a middleware body hook returns. Both fields are optional:
 *
 * - `inject`: extra props merged onto the wrapped `Component`, threaded down
 *   the middleware chain. Use it to forward IrisGrid-aware props (e.g.
 *   `transformModel`, `transformTableOptions`, `onModelChanged`) without
 *   hand-writing the widening cast on `Component`.
 * - `wrap`: an optional wrapper placed *around* the wrapped component (e.g. a
 *   context provider). Receives the already-rendered child element and must
 *   return an element that renders it.
 */
export interface MiddlewareBodyResult {
  inject?: Record<string, unknown>;
  wrap?: (child: React.ReactElement) => React.ReactElement;
}

/**
 * A hook implementing the body of a middleware. Receives the incoming props
 * (without `Component`) and returns an optional set of props to inject plus an
 * optional wrapper. The same body hook can back both a panel and a widget
 * middleware (see {@link createPanelMiddleware} / {@link createWidgetMiddleware}),
 * so a plugin expresses its behavior once.
 *
 * Type the `props` parameter as wide as the middleware needs (e.g. intersect
 * with `IrisGridTableOptionsWidgetProps`) — the factory passes the runtime
 * props through unchanged.
 */
export type MiddlewareBody<P> = (props: P) => MiddlewareBodyResult;

/**
 * Builds a panel-path middleware component from a single body hook, owning the
 * `React.forwardRef` ceremony and ref forwarding that golden-layout state
 * persistence depends on.
 *
 * The returned component is ref-capable and always forwards its `ref` to the
 * wrapped `Component`, so a middleware author can never accidentally drop it
 * (which would silently break `componentState` persistence — sorts, filters,
 * column moves — on reload). The body hook only decides what to inject and how
 * to wrap; it never sees the ref.
 */
export function createPanelMiddleware<
  T = unknown,
  P extends WidgetPanelProps<T> = WidgetPanelProps<T>,
>(
  useBody: MiddlewareBody<P>,
  displayName = 'PanelMiddleware'
): React.ForwardRefExoticComponent<
  WidgetMiddlewarePanelProps<T> & React.RefAttributes<unknown>
> {
  const PanelMiddleware = React.forwardRef<
    unknown,
    WidgetMiddlewarePanelProps<T>
  >(({ Component, ...rest }, ref) => {
    const { inject, wrap } = useBody(rest as unknown as P);
    const Next = Component as unknown as React.ForwardRefExoticComponent<
      Record<string, unknown> & React.RefAttributes<unknown>
    >;
    const child = (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Next ref={ref} {...rest} {...inject} />
    );
    return wrap != null ? wrap(child) : child;
  });
  PanelMiddleware.displayName = displayName;
  return PanelMiddleware;
}

/**
 * Builds a widget-path middleware component from a single body hook. The widget
 * path takes no ref, so this is a plain function component; otherwise it mirrors
 * {@link createPanelMiddleware} (same `inject` / `wrap` contract), letting a
 * plugin reuse one body hook for both paths.
 */
export function createWidgetMiddleware<
  T = unknown,
  P extends WidgetComponentProps<T> = WidgetComponentProps<T>,
>(
  useBody: MiddlewareBody<P>,
  displayName = 'WidgetMiddleware'
): React.ComponentType<WidgetMiddlewareComponentProps<T>> {
  function WidgetMiddleware({
    Component,
    ...rest
  }: WidgetMiddlewareComponentProps<T>): React.ReactElement {
    const { inject, wrap } = useBody(rest as unknown as P);
    const Next = Component as unknown as React.ComponentType<
      Record<string, unknown>
    >;
    const child = (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Next {...rest} {...inject} />
    );
    return wrap != null ? wrap(child) : child;
  }
  WidgetMiddleware.displayName = displayName;
  return WidgetMiddleware;
}

export type PluginManifestPluginInfo = {
  name: string;
  main: string;
  /**
   * The npm package name for this plugin (e.g. `@deephaven/js-plugin-pivot`).
   * When provided, the plugin's exports are registered in the module resolve
   * map under this key, making this plugin importable by other plugins at
   * runtime. If omitted, the plugin is not available for cross-plugin imports.
   */
  package?: string;
  /**
   * Package names this plugin depends on at runtime. These must match the
   * `package` field of other plugins in the manifest. Plugins are
   * topologically sorted so that dependencies are loaded first. If omitted,
   * the plugin has no cross-plugin dependencies.
   */
  dependencies?: string[];
  version: string;
};

export type PluginManifest = { plugins: PluginManifestPluginInfo[] };

function hasDefaultExport(value: unknown): value is { default: Plugin } {
  return (
    typeof value === 'object' &&
    value != null &&
    (value as { default?: unknown }).default != null &&
    typeof (value as { default?: unknown }).default === 'object'
  );
}

/**
 * Get the PluginModule value from a loaded module export. Handles:
 * - Direct Plugin exports (`export default myPlugin`)
 * - Named default exports (`{ default: myPlugin, ...namedExports }`)
 * - Legacy plugin formats (`{ DashboardPlugin, AuthPlugin, TablePlugin }`)
 *
 * TypeScript builds CJS default exports differently depending on whether
 * there are also named exports. If the default is the only export, it will
 * be the value. If there are also named exports, it will be assigned to
 * the `default` property on the value.
 */
export function getPluginModuleValue(
  value: LegacyPlugin | Plugin | { default: Plugin }
): PluginModule | null {
  if (isPlugin(value)) {
    return value;
  }
  if (hasDefaultExport(value) && isPlugin(value.default)) {
    return value.default;
  }
  if (isLegacyPlugin(value)) {
    return value;
  }
  return null;
}

/**
 * Register a plugin in the plugin map. If a plugin with the same name is
 * already registered, the duplicate is skipped and a warning is logged.
 * @param pluginMap The plugin map to register the plugin in
 * @param name The name to register the plugin under
 * @param plugin The plugin to register
 * @param version Optional version to attach to the plugin
 */
export function registerPlugin(
  pluginMap: PluginModuleMap,
  name: string,
  plugin: PluginModule,
  version?: string
): void {
  if (pluginMap.has(name)) {
    log.warn(`Plugin '${name}' is already registered. Skipping duplicate.`);
    return;
  }
  pluginMap.set(name, { ...plugin, version });
}

/**
 * Process a loaded plugin module: extract the plugin value, register in the
 * resolve map for cross-plugin imports, flatten MultiPlugins, and register
 * each resulting plugin in the plugin map.
 *
 * @param pluginMap The plugin map to register plugins in
 * @param resolveMap The module resolve map for cross-plugin imports
 * @param pluginExports The raw module exports from loading the plugin
 * @param name The manifest name of the plugin
 * @param packageName Optional package name for resolve map registration
 * @param version Optional version to attach to registered plugins
 */
export function processLoadedModule(
  pluginMap: PluginModuleMap,
  resolveMap: Record<string, unknown>,
  pluginExports: unknown,
  name: string,
  packageName?: string | null,
  version?: string
): void {
  // Register raw module exports in the resolve map so subsequent
  // plugins can import this plugin by its package name
  if (packageName != null) {
    // eslint-disable-next-line no-param-reassign
    resolveMap[packageName] = pluginExports;
    log.debug(`Registered plugin '${packageName}' in module resolve map`);
  }

  const moduleValue = getPluginModuleValue(
    pluginExports as LegacyPlugin | Plugin | { default: Plugin }
  );
  if (moduleValue == null) {
    log.error(`Plugin '${name}' is missing an exported value.`);
    return;
  }

  if (isMultiPlugin(moduleValue)) {
    log.debug(
      `MultiPlugin '${name}' contains ${moduleValue.plugins.length} plugins`
    );
    moduleValue.plugins.forEach(innerPlugin => {
      if (!isPlugin(innerPlugin)) {
        log.warn(
          `Skipping invalid inner plugin from MultiPlugin '${name}'`,
          innerPlugin
        );
        return;
      }

      const innerPluginName =
        typeof innerPlugin.name === 'string' ? innerPlugin.name.trim() : '';

      if (innerPluginName.length === 0) {
        log.warn(
          `Skipping unnamed inner plugin from MultiPlugin '${name}'`,
          innerPlugin
        );
        return;
      }

      registerPlugin(pluginMap, innerPluginName, innerPlugin, version);
    });
  } else {
    registerPlugin(pluginMap, name, moduleValue, version);
  }
}

/**
 * Group plugins into dependency levels for parallel loading. Plugins in the
 * same level have no dependencies on each other and can be loaded concurrently.
 * Each level's dependencies are fully contained in earlier levels.
 *
 * Handles cycles gracefully by placing remaining plugins into a final level
 * and logging an error.
 *
 * @param plugins The plugin list from the manifest
 * @returns An array of levels, where each level is an array of plugins
 */
export function groupByDependencyLevel<
  T extends Pick<PluginManifestPluginInfo, 'name' | 'package' | 'dependencies'>,
>(plugins: readonly T[]): T[][] {
  // Map from package name to plugin for dependency resolution
  const packageToPlugin = new Map<string, T>();
  plugins.forEach(p => {
    if (p.package != null) {
      packageToPlugin.set(p.package, p);
    }
  });

  // Resolve each plugin's in-manifest dependencies
  const deps = new Map<T, Set<T>>();
  plugins.forEach(p => {
    const resolved = new Set<T>();
    if (p.dependencies != null) {
      p.dependencies.forEach(dep => {
        const depPlugin = packageToPlugin.get(dep);
        if (depPlugin != null) {
          resolved.add(depPlugin);
        } else {
          log.warn(
            `Plugin '${p.name}' depends on '${dep}' which is not in the manifest`
          );
        }
      });
    }
    deps.set(p, resolved);
  });

  const levels: T[][] = [];
  const remaining = new Set(plugins);
  const loaded = new Set<T>();

  while (remaining.size > 0) {
    // Collect plugins whose dependencies are all loaded
    const level: T[] = [];
    remaining.forEach(p => {
      const pDeps = deps.get(p);
      if (pDeps == null || pDeps.size === 0) {
        level.push(p);
        return;
      }
      let allLoaded = true;
      pDeps.forEach(d => {
        if (!loaded.has(d)) {
          allLoaded = false;
        }
      });
      if (allLoaded) {
        level.push(p);
      }
    });

    if (level.length === 0) {
      // Cycle detected — load remaining plugins together as a final level
      const inCycle = [...remaining].map(p => p.name);
      log.error(
        `Circular plugin dependency detected among: ${inCycle.join(
          ', '
        )}. Loading remaining plugins together.`
      );
      levels.push([...remaining]);
      break;
    }

    levels.push(level);
    level.forEach(p => {
      remaining.delete(p);
      loaded.add(p);
    });
  }

  return levels;
}

/**
 * Get the WidgetPlugin that supports opening a widget of the given type as a dashboard.
 * @param pluginMap Map of available plugins
 * @param type Type of widget to check
 * @returns The WidgetPlugin that supports opening this widget as a dashboard, or null if no matching plugin is found
 */
export function getWidgetDashboardPlugin(
  pluginMap: PluginModuleMap,
  type: string
): WidgetDashboardPlugin | null {
  return (
    [...pluginMap.values()].find(
      (entry): entry is WidgetDashboardPlugin =>
        isWidgetDashboardPlugin(entry) &&
        [entry.dashboardTypes].flat().some(t => t === type)
    ) ?? null
  );
}
