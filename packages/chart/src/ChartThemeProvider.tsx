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

  // The `ThemeProvider` that supplies `activeThemes` also provides the corresponding
  // CSS theme variables to the DOM by dynamically rendering <style> tags whenever
  // the `activeThemes` change. Painting the latest CSS variables to the DOM may
  // not happen until after `ChartThemeProvider` is rendered, but they should be
  // available by the time the effect runs. Therefore, it is important to derive
  // the chart theme in an effect instead of deriving in a `useMemo` to ensure
  // we have the latest CSS variables.
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
