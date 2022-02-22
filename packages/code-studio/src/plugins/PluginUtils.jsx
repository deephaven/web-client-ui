import React, { Suspense } from 'react';
import Log from '@deephaven/log';
import RemoteComponent from './RemoteComponent';
import loadRemoteModule from './loadRemoteModule';

const log = Log.module('PluginUtils');

class PluginUtils {
  /**
   * Load a component plugin either specified in the REACT_APP_COMPONENT_TABLE_PLUGINS environment variable, or from the server if it's not internal.
   * @param {string} pluginName Name of the table plugin to load
   * @returns {JSX.Element} A lazily loaded JSX.Element from the plugin
   */
  static loadComponentPlugin(pluginName) {
    if (
      process.env.REACT_APP_INTERNAL_COMPONENT_PLUGINS.split(',').includes(
        pluginName
      )
    ) {
      const LazyPlugin = React.lazy(() => import(`./internal/${pluginName}`));
      const LocalPlugin = React.forwardRef((props, ref) => (
        <Suspense fallback={<div>Loading Plugin...</div>}>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <LazyPlugin ref={ref} {...props} />
        </Suspense>
      ));
      LocalPlugin.pluginName = pluginName;
      LocalPlugin.displayName = 'Local Plugin';
      return LocalPlugin;
    }

    const baseUrl = new URL(
      process.env.REACT_APP_COMPONENT_PLUGINS_URL,
      window.location
    );
    const pluginUrl = new URL(`${pluginName}.js`, baseUrl);
    const Plugin = React.forwardRef((props, ref) => (
      <RemoteComponent
        url={pluginUrl}
        render={({ err, Component }) => {
          if (err) {
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
   * @param {string} pluginUrl The URL of the plugin to load
   * @returns The loaded module
   */
  static async loadModulePlugin(pluginUrl) {
    const myModule = await loadRemoteModule(pluginUrl);
    return myModule;
  }

  /**
   * Loads a JSON file and returns the JSON object
   * @param {string} jsonUrl The URL of the JSON file to load
   * @returns The JSON object of the manifest file
   */
  static async loadJson(jsonUrl) {
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
