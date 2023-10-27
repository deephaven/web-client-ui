import { useContext, useMemo } from 'react';
import { ThemeProvider } from '@deephaven/components';
import { PluginsContext } from '@deephaven/plugin';
import { getThemeDataFromPlugins } from '../plugins';

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

  return <ThemeProvider themes={themes}>{children}</ThemeProvider>;
}

export default ThemeBootstrap;
