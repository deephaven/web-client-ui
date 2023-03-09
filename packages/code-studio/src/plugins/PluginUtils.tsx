import React, { ForwardRefExoticComponent } from 'react';
import Log from '@deephaven/log';
import RemoteComponent from './RemoteComponent';
import loadRemoteModule from './loadRemoteModule';

const log = Log.module('PluginUtils');

class PluginUtils {
  /**
   * Load a component plugin from the server.
   * @param pluginName Name of the table plugin to load
   * @returns A lazily loaded JSX.Element from the plugin
   */
  static loadComponentPlugin(
    pluginName: string
  ): ForwardRefExoticComponent<React.RefAttributes<unknown>> {
    const baseUrl = new URL(
      import.meta.env.VITE_COMPONENT_PLUGINS_URL ?? '',
      `${window.location}`
    );
    const pluginUrl = new URL(`${pluginName}.js`, baseUrl);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Plugin: any = React.forwardRef((props, ref) => (
      <RemoteComponent
        url={pluginUrl}
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
  static async loadModulePlugin(pluginUrl: string): Promise<unknown> {
    const myModule = await loadRemoteModule(pluginUrl);
    return myModule;
  }

  /**
   * Loads a JSON file and returns the JSON object
   * @param jsonUrl The URL of the JSON file to load
   * @returns The JSON object of the manifest file
   */
  static async loadJson(
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
}

export default PluginUtils;
