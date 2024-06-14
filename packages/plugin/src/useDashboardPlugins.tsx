import { useMemo } from 'react';
import {
  isDashboardPlugin,
  isLegacyDashboardPlugin,
  PluginModuleMap,
  type DashboardPlugin,
  type LegacyDashboardPlugin,
} from './PluginTypes';
import { usePlugins } from './usePlugins';

export function getDashboardPlugins(plugins: PluginModuleMap): JSX.Element[] {
  const dbPlugins = [...plugins.entries()].filter(
    ([, plugin]) => isDashboardPlugin(plugin) || isLegacyDashboardPlugin(plugin)
  ) as [string, DashboardPlugin | LegacyDashboardPlugin][];

  return dbPlugins.map(([pluginName, plugin]) => {
    if (isLegacyDashboardPlugin(plugin)) {
      const { DashboardPlugin: DPlugin } = plugin;
      return <DPlugin key={pluginName} />;
    }

    const { component: DPlugin } = plugin;
    return <DPlugin key={pluginName} />;
  });
}

/**
 * Get all DashboardPlugin elements from the plugins context
 * @returns Array of DashboardPlugin elements
 */
export function useDashboardPlugins(): JSX.Element[] {
  const plugins = usePlugins();

  const dashboardPlugins = useMemo(
    () => getDashboardPlugins(plugins),
    [plugins]
  );

  return dashboardPlugins;
}

export default useDashboardPlugins;
