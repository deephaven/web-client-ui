import { useContext, useMemo } from 'react';
import { ChartThemeProvider } from '@deephaven/chart';
import { ThemeProvider } from '@deephaven/components';
import { getThemeDataFromPlugins, PluginsContext } from '@deephaven/plugin';

export interface ThemeBootstrapProps {
  children: React.ReactNode;
}

export function ThemeBootstrap({ children }: ThemeBootstrapProps): JSX.Element {
  // The `usePlugins` hook throws if the context value is null. Since this is
  // the state while plugins load asynchronously, we are using `useContext`
  // directly to avoid the exception.
  const pluginModules = useContext(PluginsContext);

  const themes = useMemo(
    () =>
      pluginModules == null ? null : getThemeDataFromPlugins(pluginModules),
    [pluginModules]
  );

  return (
    <ThemeProvider themes={themes}>
      <ChartThemeProvider>{children}</ChartThemeProvider>
    </ThemeProvider>
  );
}

export default ThemeBootstrap;
