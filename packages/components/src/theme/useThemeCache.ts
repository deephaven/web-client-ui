import { useContextOrThrow } from '@deephaven/react-hooks';
import { ThemeCache, ThemeCacheContext } from './ThemeCache';

/**
 * Get the theme cache from the context.
 */
export function useThemeCache(): ThemeCache {
  return useContextOrThrow(
    ThemeCacheContext,
    'No ThemeCacheContext value found. Component must be wrapped in a ThemeCacheContext.Provider'
  );
}

export default useThemeCache;
