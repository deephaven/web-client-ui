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
  type WidgetComponentProps,
  type WidgetPanelProps,
  type WidgetMiddlewarePanelProps,
  isLegacyPlugin,
  isMultiPlugin,
  isPlugin,
  type LegacyPlugin,
  type Plugin,
} from './PluginTypes';

const log = Log.module('@deephaven/plugin.PluginUtils');

export function pluginSupportsType(
  plugin: PluginModule | undefined,
  type: string
): boolean {
  if (plugin == null || !isWidgetPlugin(plugin)) {
    return false;
  }

  return [plugin.supportedTypes].flat().some(t => t === type);
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
      baseComponent.displayName ?? baseComponent.name
    );
    return baseComponent;
  }

  log.debug(
    'Chaining component middleware',
    baseComponent.displayName ?? baseComponent.name,
    middleware.map(m => m.name)
  );

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

/**
 * Creates a panel component that chains middleware around a base panel component.
 * Each middleware panel wraps the next, with the base panel at the innermost layer.
 */
export function createChainedPanelComponent<T>(
  basePanelComponent: React.ComponentType<WidgetPanelProps<T>>,
  middleware: WidgetMiddlewarePlugin<T>[]
): React.ComponentType<WidgetPanelProps<T>> {
  // Filter to middleware that has a panelComponent and extract just the panel components
  type MiddlewareWithPanel = WidgetMiddlewarePlugin<T> & {
    panelComponent: React.ComponentType<WidgetMiddlewarePanelProps<T>>;
  };
  const panelMiddleware = middleware.filter(
    (m): m is MiddlewareWithPanel => m.panelComponent != null
  );

  if (panelMiddleware.length === 0) {
    log.debug(
      'No panel middleware to chain for panel component',
      basePanelComponent.displayName ?? basePanelComponent.name
    );
    return basePanelComponent;
  }

  log.debug(
    'Chaining panel middleware',
    basePanelComponent.displayName ?? basePanelComponent.name,
    panelMiddleware.map(m => m.name)
  );

  // Build the chain from inside out (base panel is innermost)
  return [...panelMiddleware]
    .reverse()
    .reduce<React.ComponentType<WidgetPanelProps<T>>>(
      (WrappedPanel, middlewarePlugin) => {
        const { panelComponent: MiddlewarePanelComponent } = middlewarePlugin;

        function ChainedPanel(props: WidgetPanelProps<T>) {
          return (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <MiddlewarePanelComponent {...props} Component={WrappedPanel} />
          );
        }
        ChainedPanel.displayName = `${middlewarePlugin.name}Panel(${
          (WrappedPanel as React.ComponentType).displayName ??
          (WrappedPanel as React.ComponentType).name ??
          'Panel'
        })`;
        return ChainedPanel;
      },
      basePanelComponent
    );
}

export type PluginManifestPluginInfo = {
  name: string;
  main: string;
  /**
   * The npm package name for this plugin (e.g. `@deephaven/js-plugin-pivot`).
   * When provided, the plugin's exports are registered in the module resolve
   * map under this key, enabling other plugins to `require()` this plugin at
   * runtime. If omitted, the plugin is not registered for cross-plugin imports.
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

/**
 * Topologically sort plugins so that dependencies are loaded before the
 * plugins that depend on them. Plugins without dependencies or whose
 * dependencies are not in the manifest keep their original relative order
 * (stable sort). Throws if a dependency cycle is detected.
 *
 * @param plugins The plugin list from the manifest
 * @returns A new array with plugins sorted so dependencies come first
 */
export function sortPluginsByDependency<
  T extends Pick<PluginManifestPluginInfo, 'name' | 'package' | 'dependencies'>,
>(plugins: readonly T[]): T[] {
  // Build a lookup from package name → plugin index
  const packageToIndex = new Map<string, number>();
  plugins.forEach((p, i) => {
    if (p.package != null) {
      packageToIndex.set(p.package, i);
    }
  });

  // Build adjacency list: index → indices it depends on
  const depIndices = new Map<number, number[]>();
  plugins.forEach((p, i) => {
    if (p.dependencies != null && p.dependencies.length > 0) {
      const resolved: number[] = [];
      p.dependencies.forEach(dep => {
        const idx = packageToIndex.get(dep);
        if (idx != null) {
          resolved.push(idx);
        } else {
          log.warn(
            `Plugin '${p.name}' depends on '${dep}' which is not in the manifest`
          );
        }
      });
      if (resolved.length > 0) {
        depIndices.set(i, resolved);
      }
    }
  });

  // If no plugin has in-manifest dependencies, return original order
  if (depIndices.size === 0) {
    return [...plugins];
  }

  // Kahn's algorithm for topological sort (stable — preserves original order
  // among plugins at the same dependency depth)
  const inDegree = new Array<number>(plugins.length).fill(0);

  // Reverse adjacency: who depends on me?
  const dependents = new Map<number, number[]>();
  depIndices.forEach((deps, idx) => {
    deps.forEach(dep => {
      if (!dependents.has(dep)) {
        dependents.set(dep, []);
      }
      const depList = dependents.get(dep);
      if (depList != null) {
        depList.push(idx);
      }
      inDegree[idx] += 1;
    });
  });

  // Seed queue with all nodes that have no in-manifest dependencies,
  // in their original order
  const queue: number[] = [];
  for (let i = 0; i < plugins.length; i += 1) {
    if (inDegree[i] === 0) {
      queue.push(i);
    }
  }

  const sorted: T[] = [];
  while (queue.length > 0) {
    const idx = queue.shift();
    if (idx == null) {
      break;
    }
    sorted.push(plugins[idx]);
    const deps = dependents.get(idx);
    if (deps != null) {
      // Process dependents in original manifest order for stability
      deps.sort((a, b) => a - b);
      deps.forEach(depIdx => {
        inDegree[depIdx] -= 1;
        if (inDegree[depIdx] === 0) {
          queue.push(depIdx);
        }
      });
    }
  }

  if (sorted.length !== plugins.length) {
    // Find the cycle participants for a useful error message
    const inCycle = plugins.filter((_, i) => inDegree[i] > 0).map(p => p.name);
    throw new Error(
      `Circular plugin dependency detected among: ${inCycle.join(', ')}`
    );
  }

  return sorted;
}

function hasDefaultExport(value: unknown): value is { default: Plugin } {
  return (
    typeof value === 'object' &&
    value != null &&
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
