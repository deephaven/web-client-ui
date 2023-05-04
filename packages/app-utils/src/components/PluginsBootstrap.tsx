import React, { createContext, useEffect, useState } from 'react';
import { PluginModuleMap, loadModulePlugins } from '../plugins';

export const PluginsContext = createContext<PluginModuleMap | null>(null);

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
  const [plugins, setPlugins] = useState<PluginModuleMap | null>(null);
  useEffect(
    function initPlugins() {
      let isCanceled = false;
      async function loadPlugins() {
        const pluginModules = await loadModulePlugins(pluginsUrl);
        if (!isCanceled) {
          setPlugins(pluginModules);
        }
      }
      loadPlugins();
      return () => {
        isCanceled = true;
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
