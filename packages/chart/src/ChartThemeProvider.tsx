import { createContext, ReactNode, useEffect, useState } from 'react';
import { useTheme } from '@deephaven/components';
import defaultChartTheme, { ChartTheme } from './ChartTheme';

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

  const [chartTheme, setChartTheme] = useState<ChartTheme | null>(null);

  // Running in an effect to ensure parent ThemeProvider has had a chance to add
  // the <style> tags to the DOM that provide theme variables
  useEffect(() => {
    if (activeThemes != null) {
      setChartTheme(defaultChartTheme());
    }
  }, [activeThemes]);

  return (
    <ChartThemeContext.Provider value={chartTheme}>
      {children}
    </ChartThemeContext.Provider>
  );
}
