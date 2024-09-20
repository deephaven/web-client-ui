import { createContext, type ReactNode, useMemo } from 'react';
import { useTheme } from '@deephaven/components';
import defaultChartTheme, { type ChartTheme } from './ChartTheme';

export type ChartThemeContextValue = ChartTheme;

export const ChartThemeContext = createContext<ChartThemeContextValue | null>(
  null
);

export interface ChartThemeProviderProps {
  children: ReactNode;
}

/*
 * Provides a chart theme based on the active themes from the ThemeProvider.
 */
export function ChartThemeProvider({
  children,
}: ChartThemeProviderProps): JSX.Element {
  const { activeThemes } = useTheme();

  const chartTheme = useMemo(defaultChartTheme, [activeThemes]);

  return (
    <ChartThemeContext.Provider value={chartTheme}>
      {children}
    </ChartThemeContext.Provider>
  );
}
