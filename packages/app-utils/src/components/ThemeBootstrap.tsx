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

  const { isPending: isPendingParentTheme, themeData: parentThemeData } =
    useParentWindowTheme();

  const themes = useMemo(() => {
    if (isPendingParentTheme || pluginModules == null) {
      return null;
    }

    const pluginThemes = getThemeDataFromPlugins(pluginModules);

    if (parentThemeData != null) {
      pluginThemes.push(parentThemeData);
    }

    return pluginThemes;
  }, [isPendingParentTheme, parentThemeData, pluginModules]);

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
