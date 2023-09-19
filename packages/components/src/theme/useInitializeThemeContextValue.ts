import { useCallback, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import { ThemeContextValue } from './ThemeContext';
import { DEFAULT_DARK_THEME_KEY, ThemeData } from './ThemeModel';
import { calculatePreloadStyleContent } from './ThemeUtils';
import { useAppliedThemes } from './useAppliedThemes';
import { useThemeCache } from './useThemeCache';

const log = Log.module('useInitializeThemeContextValue');

/**
 * Creates a `ThemeContextValue` based on the current `ThemeCacheContext`.
 */
export function useInitializeThemeContextValue(): ThemeContextValue {
  const cache = useThemeCache();
  const appliedThemes = useAppliedThemes(cache);

  const [isActive, setIsActive] = useState(false);

  const activeThemes = useMemo(
    () => (isActive ? appliedThemes : null),
    [appliedThemes, isActive]
  );

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

  // Set selected themes when theming is activated
  useEffect(() => {
    if (activeThemes == null) {
      return;
    }

    log.debug(
      'Themes activated:',
      activeThemes[0]?.themeKey,
      activeThemes[1]?.themeKey
    );

    cache.setPreloadData({
      themeKey: activeThemes.at(-1)?.themeKey ?? DEFAULT_DARK_THEME_KEY,
      preloadStyleContent: calculatePreloadStyleContent(),
    });
  }, [activeThemes, cache]);

  return useMemo(
    () => ({ activeThemes, cache, isActive, registerCustomThemesAndActivate }),
    [activeThemes, cache, isActive, registerCustomThemesAndActivate]
  );
}

export default useInitializeThemeContextValue;
