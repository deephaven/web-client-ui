import { useMemo } from 'react';
import { useExternalTheme, type ThemeData } from '@deephaven/components';
import {
  getThemeDataFromPlugins,
  type PluginModuleMap,
} from '@deephaven/plugin';

/**
 * Use custom external or plugin themes.
 * @param pluginModules The plugin modules to get themes from when external
 * themes are disabled.
 */
export function useCustomThemes(
  pluginModules?: PluginModuleMap | null
): ThemeData[] | null {
  const {
    isEnabled: isExternalThemeEnabled,
    isPending: isExternalThemePending,
    themeData: externalThemeData,
  } = useExternalTheme();

  return useMemo(() => {
    // Get theme from parent window via `postMessage` apis
    if (isExternalThemeEnabled) {
      if (isExternalThemePending) {
        return null;
      }

      return externalThemeData ? [externalThemeData] : [];
    }

    // Get themes from plugins
    return pluginModules == null
      ? null
      : getThemeDataFromPlugins(pluginModules);
  }, [
    isExternalThemeEnabled,
    isExternalThemePending,
    externalThemeData,
    pluginModules,
  ]);
}

export default useCustomThemes;
