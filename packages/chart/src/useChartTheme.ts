import { useContext } from 'react';

import {
  ChartThemeContext,
  ChartThemeContextValue,
} from './ChartThemeProvider';

/**
 * Hook to get the current `ChartThemeContextValue`.
 */
export function useChartTheme(): ChartThemeContextValue | null {
  return useContext(ChartThemeContext);
}

export default useChartTheme;
