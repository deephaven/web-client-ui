import { useMemo } from 'react';
import { usePlugins } from './usePlugins';
import { getPluginsElementMap } from './PluginUtils';
import type { ElementMap } from './PluginTypes';

/**
 * Get all ElementPlugin elements from the plugins context
 * @returns ElementPlugin mapping as a Map of plugin name to component type
 */
export function usePluginsElementMap(): ElementMap {
  // Get all plugins from the context
  const plugins = usePlugins();

  const elementPlugins = useMemo(
    () => getPluginsElementMap(plugins),
    [plugins]
  );

  return elementPlugins;
}

export default usePluginsElementMap;
