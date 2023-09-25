import {
  getDefaultBaseThemes,
  ThemeContext,
  useInitializeThemeContextValue,
} from '@deephaven/components';
import { useContext, useEffect } from 'react';
import { getThemeDataFromPlugins } from '../plugins';
import { PluginsContext } from './PluginsBootstrap';

export interface ThemeBootstrapProps {
  children: React.ReactNode;
}

export function ThemeBootstrap({ children }: ThemeBootstrapProps): JSX.Element {
  const themeContextValue = useInitializeThemeContextValue();

  // The `usePlugins` hook throws if the context value is null. Since this is
  // the state while plugins load asynchronously, we are using `useContext`
  // directly to avoid the exception.
  const pluginModules = useContext(PluginsContext);
  const { registerThemes } = themeContextValue;

  useEffect(() => {
    if (pluginModules == null) {
      return;
    }

    registerThemes({
      base: getDefaultBaseThemes(),
      custom: getThemeDataFromPlugins(pluginModules),
    });
  }, [pluginModules, registerThemes]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {themeContextValue.activeThemes?.map(theme => (
        <style data-theme-key={theme.themeKey} key={theme.themeKey}>
          {theme.styleContent}
        </style>
      ))}
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeBootstrap;
