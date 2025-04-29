import { useContext, useMemo } from 'react';
import { ChartThemeProvider } from '@deephaven/chart';
import { MonacoThemeProvider } from '@deephaven/console';
import { ThemeProvider } from '@deephaven/components';
import { IrisGridThemeProvider } from '@deephaven/iris-grid';
import { getThemeDataFromPlugins, PluginsContext } from '@deephaven/plugin';
import { getSettings } from '@deephaven/redux';
import { useAppSelector } from '@deephaven/dashboard';
import { useParentWindowTheme } from '@deephaven/jsapi-components';

export interface ThemeBootstrapProps {
  children: React.ReactNode;
}

export function ThemeBootstrap({
  children,
}: ThemeBootstrapProps): JSX.Element | null {
  // The `usePlugins` hook throws if the context value is null. Since this is
  // the state while plugins load asynchronously, we are using `useContext`
  // directly to avoid the exception.
  const pluginModules = useContext(PluginsContext);

  const { isPending: isPendingParentTheme, themeData } = useParentWindowTheme();

  const themes = useMemo(() => {
    if (isPendingParentTheme || pluginModules == null) {
      return null;
    }

    const pluginThemes = getThemeDataFromPlugins(pluginModules);

    if (themeData != null) {
      pluginThemes.push(themeData);
    }

    return pluginThemes;
  }, [isPendingParentTheme, pluginModules, themeData]);

  console.log('[TESTING] isPendingParentTheme:', isPendingParentTheme, themes);

  const settings = useAppSelector(getSettings);

  return isPendingParentTheme ? null : (
    <ThemeProvider themes={themes}>
      <ChartThemeProvider>
        <MonacoThemeProvider>
          <IrisGridThemeProvider density={settings.gridDensity}>
            {children}
          </IrisGridThemeProvider>
        </MonacoThemeProvider>
      </ChartThemeProvider>
    </ThemeProvider>
  );
}

export default ThemeBootstrap;
