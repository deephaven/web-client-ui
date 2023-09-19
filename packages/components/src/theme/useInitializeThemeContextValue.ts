import { useCallback, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import { useThemeCache } from './ThemeCache';
import { ThemeContextValue } from './ThemeContext';
import { DEFAULT_DARK_THEME_KEY, ThemeData } from './ThemeModel';
import { calculatePreloadStyleContent } from './ThemeUtils';

const log = Log.module('useInitializeThemeContextValue');

/**
 * Creates a `ThemeContextValue` based on the current `ThemeCacheContext`.
 */
export function useInitializeThemeContextValue(): ThemeContextValue {
  const cache = useThemeCache();
  const [, setCacheTick] = useState(0);

  const [isActive, setIsActive] = useState(false);

  /**
   * Register the given custom themes with the cache and activate theming.
   */
  const registerCustomThemesAndActivate = useCallback(
    (additionalThemeData: ThemeData[]) => {
      cache.registerCustomThemes(additionalThemeData);
      setIsActive(true);
    },
    [cache]
  );

  // Intentionally not using `useMemo` here since the `cache` manages
  // memoization internally, and the return value of `getAppliedThemes` may
  // change in a way that can't be directly detected in this hook.
  const activeThemes = isActive ? cache.getAppliedThemes() : null;

  // Register an event listener to update the cache tick when the cache changes
  useEffect(
    () =>
      cache.registerEventListener('change', () => {
        log.debug('Theme cache changed');
        setCacheTick(i => i + 1);
      }),
    [cache]
  );

  // Set selected themes when theming is activated
  useEffect(() => {
    if (!isActive) {
      return;
    }

    log.debug(
      'Themes activated:',
      activeThemes?.[0]?.themeKey,
      activeThemes?.[1]?.themeKey
    );

    cache.setPreloadData({
      themeKey: activeThemes?.at(-1)?.themeKey ?? DEFAULT_DARK_THEME_KEY,
      preloadStyleContent: calculatePreloadStyleContent(),
    });
  }, [activeThemes, cache, isActive]);

  return useMemo(
    () => ({ activeThemes, cache, isActive, registerCustomThemesAndActivate }),
    [activeThemes, cache, isActive, registerCustomThemesAndActivate]
  );
}

export default useInitializeThemeContextValue;
