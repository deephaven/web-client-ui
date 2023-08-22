import Log from '@deephaven/log';
import {
  type PluginModule,
  type AuthPlugin,
  type AuthPluginComponent,
  isAuthPlugin,
  LegacyAuthPlugin,
  LegacyPlugin,
  Plugin,
  PluginType,
} from '@deephaven/plugin';
import loadRemoteModule from './loadRemoteModule';

const log = Log.module('@deephaven/app-utils.PluginUtils');

export type PluginModuleMap = Map<string, PluginModule>;

export type PluginManifestPluginInfo = {
  name: string;
  main: string;
  version: string;
};

export type PluginManifest = { plugins: PluginManifestPluginInfo[] };

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
 * Load all plugin modules available based on the manifest file at the provided base URL
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
    const pluginPromises: Promise<LegacyPlugin | { default: Plugin }>[] = [];
    for (let i = 0; i < manifest.plugins.length; i += 1) {
      const { name, main } = manifest.plugins[i];
      const pluginMainUrl = `${modulePluginsUrl}/${name}/${main}`;
      pluginPromises.push(loadModulePlugin(pluginMainUrl));
    }
    const pluginModules = await Promise.allSettled(pluginPromises);

    const pluginMap: PluginModuleMap = new Map();
    for (let i = 0; i < pluginModules.length; i += 1) {
      const module = pluginModules[i];
      const { name } = manifest.plugins[i];
      if (module.status === 'fulfilled') {
        pluginMap.set(
          name,
          'default' in module.value ? module.value.default : module.value
        );
      } else {
        log.error(`Unable to load plugin ${name}`, module.reason);
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
  // Filter out all the plugins that are auth plugins, and then map them to [pluginName, AuthPlugin] pairs
  // Uses some pretty disgusting casting, because TypeScript wants to treat it as an (string | AuthPlugin)[] array instead
  const legacyAuthPlugins: AuthPlugin[] = (
    [...pluginMap.entries()].filter(([, plugin]) => 'Component' in plugin) as [
      string,
      LegacyAuthPlugin,
    ][]
  ).map(([name, { Component, isAvailable }]) => ({
    type: PluginType.AUTH_PLUGIN,
    name,
    isAvailable,
    component: Component,
  }));

  const authPlugins = legacyAuthPlugins.concat(
    [...pluginMap.values()].filter<AuthPlugin>(isAuthPlugin)
  );

  // Add all the core plugins in priority
  authPlugins.push(
    ...[...corePlugins.entries()].map(([name, plugin]) =>
      'type' in plugin
        ? plugin
        : {
            type: PluginType.AUTH_PLUGIN,
            name,
            component: plugin.Component,
            isAvailable: plugin.isAvailable,
          }
    )
  );

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
