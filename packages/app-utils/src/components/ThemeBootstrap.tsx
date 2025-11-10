import { useContext } from 'react';
import { ChartThemeProvider } from '@deephaven/chart';
import { MonacoThemeProvider } from '@deephaven/console';
import {
  isExternalThemeEnabled,
  LoadingOverlay,
  ThemeProvider,
} from '@deephaven/components';
import { useAppSelector } from '@deephaven/dashboard';
import { IrisGridThemeProvider } from '@deephaven/iris-grid';
import { PluginsContext, useCustomThemes } from '@deephaven/plugin';
import { getSettings } from '@deephaven/redux';

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
  const waitForActivation = isExternalThemeEnabled();

  return (
    <ThemeProvider
      themes={themes}
      waitForActivation={waitForActivation}
      loadingElement={<LoadingOverlay data-testid="theme-provider-loading" />}
    >
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
