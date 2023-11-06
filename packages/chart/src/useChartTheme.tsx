import { useContextOrThrow } from '@deephaven/react-hooks';

import {
  ChartThemeContext,
  ChartThemeContextValue,
} from './ChartThemeProvider';

/**
 * Hook to get the current `ChartThemeContextValue`.
 */
export function useChartTheme(): ChartThemeContextValue {
  return useContextOrThrow(
    ChartThemeContext,
    'No ChartThemeContext value found.'
  );
}

export default useChartTheme;
