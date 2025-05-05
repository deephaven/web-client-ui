import { useContext } from 'react';
import { ChartThemeProvider } from '@deephaven/chart';
import { MonacoThemeProvider } from '@deephaven/console';
import { ThemeProvider } from '@deephaven/components';
import { useAppSelector } from '@deephaven/dashboard';
import { IrisGridThemeProvider } from '@deephaven/iris-grid';
import { PluginsContext } from '@deephaven/plugin';
import { getSettings } from '@deephaven/redux';
import { useCustomThemes } from './useCustomThemes';

export interface ThemeBootstrapProps {
  children: React.ReactNode;
}

export function ThemeBootstrap({
  children,
}: ThemeBootstrapProps): JSX.Element | null {
  const settings = useAppSelector(getSettings);

  // The `usePlugins` hook throws if the context value is null. Since this is
  // the state while plugins load asynchronously, we are using `useContext`
  // directly to avoid the exception.
  const pluginModules = useContext(PluginsContext);
  const themes = useCustomThemes(pluginModules);

  return (
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
