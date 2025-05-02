import { useParentWindowTheme, type ThemeData } from '@deephaven/components';
import { getThemeDataFromPlugins, PluginsContext } from '@deephaven/plugin';
import { useContext, useMemo } from 'react';

/**
 * Use custom themes from the parent window or plugins.
 */
export function useCustomThemes(): ThemeData[] | null {
  const {
    isEnabled: isParentThemeEnabled,
    isPending: isParentThemePending,
    themeData: parentThemeData,
  } = useParentWindowTheme();

  // The `usePlugins` hook throws if the context value is null. Since this is
  // the state while plugins load asynchronously, we are using `useContext`
  // directly to avoid the exception.
  const pluginModules = useContext(PluginsContext);

  return useMemo(() => {
    // Get theme from parent window via `postMessage` apis
    if (isParentThemeEnabled) {
      if (isParentThemePending) {
        return null;
      }

      return parentThemeData ? [parentThemeData] : [];
    }

    // Get themes from plugins
    return pluginModules == null
      ? null
      : getThemeDataFromPlugins(pluginModules);
  }, [
    isParentThemeEnabled,
    isParentThemePending,
    parentThemeData,
    pluginModules,
  ]);
}

export default useCustomThemes;
