import React, { ForwardRefExoticComponent } from 'react';
import Log from '@deephaven/log';
import RemoteComponent from './RemoteComponent';
import loadRemoteModule from './loadRemoteModule';

const log = Log.module('@deephaven/plugin-utils.PluginUtils');

// A DeephavenPluginModule. This interface should have new fields added to it from different levels of plugins.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DeephavenPluginModule {}

export type DeephavenPluginModuleMap = Map<string, DeephavenPluginModule>;

/**
 * Load a component plugin from the server.
 * @param baseURL Base URL of the plugin server
 * @param pluginName Name of the component plugin to load
 * @returns A lazily loaded JSX.Element from the plugin
 */
export function loadComponentPlugin(
  baseURL: URL,
  pluginName: string
): ForwardRefExoticComponent<React.RefAttributes<unknown>> {
  const pluginUrl = new URL(`${pluginName}.js`, baseURL);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Plugin: any = React.forwardRef((props, ref) => (
    <RemoteComponent
      url={pluginUrl.href}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render={({ err, Component }: { err: unknown; Component: any }) => {
        if (err != null && err !== '') {
          const errorMessage = `Error loading plugin ${pluginName} from ${pluginUrl} due to ${err}`;
          log.error(errorMessage);
          return <div className="error-message">{`${errorMessage}`}</div>;
        }
        // eslint-disable-next-line react/jsx-props-no-spreading
        return <Component ref={ref} {...props} />;
      }}
    />
  ));
  Plugin.pluginName = pluginName;
  Plugin.displayName = 'Plugin';
  return Plugin;
}

/**
 * Imports a commonjs plugin module from the provided URL
 * @param pluginUrl The URL of the plugin to load
 * @returns The loaded module
 */
export async function loadModulePlugin(pluginUrl: string): Promise<unknown> {
  const myModule = await loadRemoteModule(pluginUrl);
  return myModule;
}

/**
 * Loads a JSON file and returns the JSON object
 * @param jsonUrl The URL of the JSON file to load
 * @returns The JSON object of the manifest file
 */
export async function loadJson(
  jsonUrl: string
): Promise<{ plugins: { name: string; main: string }[] }> {
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
 * Load all plugin modules available.
 * @param modulePluginsUrl The base URL of the module plugins to load
 * @returns A map from the name of the plugin to the plugin module that was loaded
 */
export async function loadModulePlugins(
  modulePluginsUrl: string
): Promise<DeephavenPluginModuleMap> {
  log.debug('Loading plugins...');
  try {
    const manifest = await loadJson(modulePluginsUrl);

    if (!Array.isArray(manifest.plugins)) {
      throw new Error('Plugin manifest JSON does not contain plugins array');
    }

    log.debug('Plugin manifest loaded:', manifest);
    const pluginPromises: Promise<unknown>[] = [];
    for (let i = 0; i < manifest.plugins.length; i += 1) {
      const { name, main } = manifest.plugins[i];
      const pluginMainUrl = `${modulePluginsUrl}/${name}/${main}`;
      pluginPromises.push(loadModulePlugin(pluginMainUrl));
    }
    const pluginModules = await Promise.allSettled(pluginPromises);

    const pluginMap: DeephavenPluginModuleMap = new Map();
    for (let i = 0; i < pluginModules.length; i += 1) {
      const module = pluginModules[i];
      const { name } = manifest.plugins[i];
      if (module.status === 'fulfilled') {
        pluginMap.set(name, module.value as DeephavenPluginModule);
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
