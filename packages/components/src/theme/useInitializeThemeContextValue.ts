import { useCallback, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import { ThemeContextValue } from './ThemeContext';
import { ThemeData } from './ThemeModel';
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

  // Once themes are activated, cache the preload data for next time page is
  // refreshed.
  useEffect(() => {
    const activeThemeKey = activeThemes?.at(-1)?.themeKey;

    if (activeThemeKey == null) {
      log.debug('No active themes');
      return;
    }

    log.debug('Active themes:', activeThemes?.map(theme => theme.themeKey));

    cache.setPreloadData({
      themeKey: activeThemeKey,
      preloadStyleContent: calculatePreloadStyleContent(),
    });
  }, [activeThemes, cache]);

  return useMemo(
    () => ({ activeThemes, cache, isActive, registerCustomThemesAndActivate }),
    [activeThemes, cache, isActive, registerCustomThemesAndActivate]
  );
}

export default useInitializeThemeContextValue;
