import { useMemo } from 'react';
import { usePlugins } from './usePlugins';
import { getElementPluginMap } from './PluginUtils';
import { ElementMap } from './PluginTypes';

/**
 * Get all ElementPlugin elements from the plugins context
 * @returns ElementPlugin mapping as a Map of plugin name to component type
 */
export function useElementPluginMapping(): ElementMap {
  // Get all plugins from the context
  const plugins = usePlugins();

  const elementPlugins = useMemo(() => getElementPluginMap(plugins), [plugins]);

  return elementPlugins;
}

export default useElementPluginMapping;
