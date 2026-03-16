import React, { useEffect, useState } from 'react';
import {
  type Plugin,
  type PluginModuleMap,
  PluginsContext,
  isMultiPlugin,
  type MultiPlugin,
} from '@deephaven/plugin';
import { loadModulePlugins } from '../plugins';

export type PluginsBootstrapProps = {
  /**
   * Base URL of the plugins to load.
   */
  pluginsUrl: string;

  /**
   * The core plugins to load.
   * Can include MultiPlugin instances which will be flattened.
   */
  getCorePlugins?: () => Promise<(Plugin | MultiPlugin)[]>;

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
          // Flatten MultiPlugins in core plugins
          const corePluginPairs = corePlugins.flatMap(plugin => {
            if (isMultiPlugin(plugin)) {
              return plugin.plugins.map(
                innerPlugin => [innerPlugin.name, innerPlugin] as const
              );
            }
            return [[plugin.name, plugin] as const];
          });
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
