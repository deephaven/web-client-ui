import React, { ForwardRefExoticComponent } from 'react';
import Log from '@deephaven/log';
import RemoteComponent from './RemoteComponent';
import loadRemoteModule from './loadRemoteModule';

const log = Log.module('@deephaven/plugin-utils.PluginUtils');

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
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.addEventListener('load', () => {
      try {
        const json = JSON.parse(request.responseText);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    });
    request.addEventListener('error', err => {
      reject(err);
    });
    request.open('GET', jsonUrl);
    request.send();
  });
}
