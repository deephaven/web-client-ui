import { useContextOrThrow } from '@deephaven/react-hooks';
import { ThemeContext, ThemeContextValue } from './ThemeProvider';

/**
 * Hook to get the current `ThemeContextValue`.
 */
export function useTheme(): ThemeContextValue {
  return useContextOrThrow(
    ThemeContext,
    'No ThemeContext value found. Component must be wrapped in a ThemeContext.Provider'
  );
}

export default useTheme;
