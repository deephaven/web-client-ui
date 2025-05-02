import { ChartThemeProvider } from '@deephaven/chart';
import { MonacoThemeProvider } from '@deephaven/console';
import { ThemeProvider } from '@deephaven/components';
import { IrisGridThemeProvider } from '@deephaven/iris-grid';
import { getSettings } from '@deephaven/redux';
import { useAppSelector } from '@deephaven/dashboard';
import { useCustomThemes } from './useCustomThemes';

export interface ThemeBootstrapProps {
  children: React.ReactNode;
}

export function ThemeBootstrap({
  children,
}: ThemeBootstrapProps): JSX.Element | null {
  const settings = useAppSelector(getSettings);
  const themes = useCustomThemes();

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
