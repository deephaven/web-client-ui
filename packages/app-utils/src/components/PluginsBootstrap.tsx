import React, { createContext, useEffect, useState } from 'react';
import { DeephavenPluginModuleMap } from '@deephaven/redux';
import { loadModulePlugins } from '../plugins';

export const PluginsContext = createContext<DeephavenPluginModuleMap | null>(
  null
);

export type PluginsBootstrapProps = {
  /**
   * Base URL of the plugins to load.
   */
  pluginsUrl: string;

  /**
   * The children to render wrapped with the PluginsContext.
   * Note that it renders the children even if the plugins aren't loaded yet.
   */
  children: React.ReactNode;
};

/**
 * PluginsBootstrap component. Handles loading the plugins.
 */
export function PluginsBootstrap({
  pluginsUrl,
  children,
}: PluginsBootstrapProps) {
  const [plugins, setPlugins] = useState<DeephavenPluginModuleMap | null>(null);
  useEffect(
    function initPlugins() {
      let isCancelled = false;
      async function loadPlugins() {
        const pluginModules = await loadModulePlugins(pluginsUrl);
        if (!isCancelled) {
          setPlugins(pluginModules);
        }
      }
      loadPlugins();
      return () => {
        isCancelled = true;
      };
    },
    [pluginsUrl]
  );

  return (
    <PluginsContext.Provider value={plugins}>
      {children}
    </PluginsContext.Provider>
  );
}

export default PluginsBootstrap;
