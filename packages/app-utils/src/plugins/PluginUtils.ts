import Log from '@deephaven/log';
import {
  type PluginModuleMap,
  type AuthPlugin,
  type AuthPluginComponent,
  isAuthPlugin,
  type LegacyAuthPlugin,
  type LegacyPlugin,
  type Plugin,
  PluginType,
  isLegacyAuthPlugin,
  processLoadedModule,
  groupByDependencyLevel,
  type PluginManifest,
  type PluginManifestPluginInfo,
  getPluginModuleValue,
} from '@deephaven/plugin';
import loadRemoteModule from './loadRemoteModule';
import { resolve } from './remote-component.config';

const log = Log.module('@deephaven/app-utils.PluginUtils');

/**
 * @deprecated Import from `@deephaven/plugin` instead.
 */
export type { PluginManifestPluginInfo };

/**
 * @deprecated Import from `@deephaven/plugin` instead.
 */
export type { PluginManifest };

/**
 * @deprecated Import from `@deephaven/plugin` instead.
 */
export { getPluginModuleValue };

/**
 * Imports a commonjs plugin module from the provided URL
 * @param pluginUrl The URL of the plugin to load
 * @returns The loaded module
 */
export async function loadModulePlugin(
  pluginUrl: string
): Promise<LegacyPlugin | { default: Plugin }> {
  const myModule = await loadRemoteModule(pluginUrl);
  return myModule;
}

/**
 * Loads a JSON file and returns the JSON object
 * @param jsonUrl The URL of the JSON file to load
 * @returns The JSON object of the manifest file
 */
export async function loadJson(jsonUrl: string): Promise<PluginManifest> {
  const res = await fetch(jsonUrl);
  if (!res.ok) {
    throw new Error(res.statusText);
  }
  try {
    return await res.json();
  } catch {
    throw new Error('Could not be parsed as JSON');
  }
}

/**
 * Load all plugin modules available based on the manifest file at the provided base URL.
 * Plugins are grouped into dependency levels and loaded in parallel within each
 * level. Levels are processed sequentially so that each level's exports are
 * registered in the module resolve map before the next level loads, enabling
 * cross-plugin imports via standard import statements.
 * @param modulePluginsUrl The base URL of the module plugins to load
 * @returns A map from the name of the plugin to the plugin module that was loaded
 */
export async function loadModulePlugins(
  modulePluginsUrl: string
): Promise<PluginModuleMap> {
  log.debug('Loading plugins...');
  try {
    const manifest = await loadJson(`${modulePluginsUrl}/manifest.json`);

    if (!Array.isArray(manifest.plugins)) {
      throw new Error('Plugin manifest JSON does not contain plugins array');
    }

    log.debug('Plugin manifest loaded:', manifest);

    const levels = groupByDependencyLevel(manifest.plugins);

    const pluginMap: PluginModuleMap = new Map();

    // Load plugins level by level. Plugins within a level have no
    // inter-dependencies and load in parallel. Each level completes
    // before the next starts so cross-plugin imports resolve correctly.
    for (let lvl = 0; lvl < levels.length; lvl += 1) {
      const level = levels[lvl];

      // eslint-disable-next-line no-await-in-loop
      const results = await Promise.allSettled(
        level.map(async plugin => {
          const { name, main, version, package: packageName } = plugin;
          const pluginMainUrl = `${modulePluginsUrl}/${name}/${main}`;
          const pluginExports = await loadModulePlugin(pluginMainUrl);
          return { pluginExports, name, packageName, version };
        })
      );

      for (let r = 0; r < results.length; r += 1) {
        const result = results[r];
        if (result.status === 'fulfilled') {
          const { pluginExports, name, packageName, version } = result.value;
          processLoadedModule(
            pluginMap,
            resolve,
            pluginExports,
            name,
            packageName,
            version
          );
        } else {
          log.error(`Unable to load plugin '${level[r].name}'`, result.reason);
        }
      }
    }
    log.info('Plugins loaded:', pluginMap);

    return pluginMap;
  } catch (e) {
    log.error('Unable to load plugins:', e);
    return new Map();
  }
}

export function getAuthHandlers(
  authConfigValues: Map<string, string>
): string[] {
  return authConfigValues.get('AuthHandlers')?.split(',') ?? [];
}

/**
 * Get the auth plugin component from the plugin map and current configuration
 * Throws if no auth plugin is available
 *
 * @param pluginMap Map of plugins loaded from the server
 * @param authConfigValues Auth config values from the server
 * @param corePlugins Map of core auth plugins to include in the list. They are added after the loaded plugins
 * @returns The auth plugin component to render
 */
export function getAuthPluginComponent(
  pluginMap: PluginModuleMap,
  authConfigValues: Map<string, string>,
  corePlugins = new Map<string, AuthPlugin | LegacyAuthPlugin>()
): AuthPluginComponent {
  const authHandlers = getAuthHandlers(authConfigValues);
  // User plugins take priority over core plugins
  const authPlugins = (
    [...pluginMap.entries(), ...corePlugins.entries()].filter(
      ([, plugin]) => isAuthPlugin(plugin) || isLegacyAuthPlugin(plugin)
    ) as [string, AuthPlugin | LegacyAuthPlugin][]
  ).map(([name, plugin]) => {
    if (isLegacyAuthPlugin(plugin)) {
      return {
        type: PluginType.AUTH_PLUGIN,
        name,
        component: plugin.AuthPlugin.Component,
        isAvailable: plugin.AuthPlugin.isAvailable,
      };
    }

    return plugin;
  });

  // Filter the available auth plugins
  const availableAuthPlugins = authPlugins.filter(({ isAvailable }) =>
    isAvailable(authHandlers, authConfigValues)
  );

  if (availableAuthPlugins.length === 0) {
    throw new Error(
      `No login plugins found, please register a login plugin for auth handlers: ${authHandlers}`
    );
  } else if (availableAuthPlugins.length > 1) {
    log.warn(
      'More than one login plugin available, will use the first one: ',
      availableAuthPlugins.map(({ name }) => name).join(', ')
    );
  }

  const { name, component } = availableAuthPlugins[0];
  log.info('Using LoginPlugin', name);

  return component;
}
