import { type ComponentType, useMemo } from 'react';
import { usePlugins } from './usePlugins';
import { getElementPluginMapping } from './PluginUtils';

/**
 * Get all ElementPlugin elements from the plugins context
 * @returns ElementPlugin mapping as a Map of plugin name to component type
 */
export function useElementPluginMapping(): Map<string, ComponentType> {
  // Get all plugins from the context
  const plugins = usePlugins();

  const elementPlugins = useMemo(
    () => getElementPluginMapping(plugins),
    [plugins]
  );

  return elementPlugins;
}

export default useElementPluginMapping;
