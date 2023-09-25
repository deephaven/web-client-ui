import { type DashboardPlugin } from '@deephaven/plugin';
import React, { createContext, useEffect, useState } from 'react';
import { PluginModuleMap, loadModulePlugins } from '../plugins';

export const PluginsContext = createContext<PluginModuleMap | null>(null);

export type PluginsBootstrapProps = {
  /**
   * Base URL of the plugins to load.
   */
  pluginsUrl: string;

  /** The core plugins to load. */
  getCorePlugins?: () => Promise<DashboardPlugin[]>;

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
  getCorePlugins,
  children,
}: PluginsBootstrapProps): JSX.Element {
  const [plugins, setPlugins] = useState<PluginModuleMap | null>(null);

  useEffect(
    function initPlugins() {
      let isCanceled = false;
      async function loadPlugins(): Promise<void> {
        const corePlugins = (await getCorePlugins?.()) ?? [];
        const pluginModules = await loadModulePlugins(pluginsUrl);

        if (!isCanceled) {
          const corePluginPairs = corePlugins.map(
            plugin => [plugin.name, plugin] as const
          );
          setPlugins(new Map([...corePluginPairs, ...pluginModules]));
        }
      }
      loadPlugins();
      return () => {
        isCanceled = true;
      };
    },
    [pluginsUrl, getCorePlugins]
  );

  return (
    <PluginsContext.Provider value={plugins}>
      {children}
    </PluginsContext.Provider>
  );
}

export default PluginsBootstrap;
