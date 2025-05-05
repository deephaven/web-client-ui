import { useContext, useMemo } from 'react';
import { useExternalTheme, type ThemeData } from '@deephaven/components';
import { getThemeDataFromPlugins, PluginsContext } from '@deephaven/plugin';

/**
 * Use custom themes from the parent window or plugins.
 */
export function useCustomThemes(): ThemeData[] | null {
  const {
    isEnabled: isExternalThemeEnabled,
    isPending: isExternalThemePending,
    themeData: externalThemeData,
  } = useExternalTheme();

  // The `usePlugins` hook throws if the context value is null. Since this is
  // the state while plugins load asynchronously, we are using `useContext`
  // directly to avoid the exception.
  const pluginModules = useContext(PluginsContext);

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
