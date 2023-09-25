import { useCallback, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import { ThemeContextValue } from './ThemeContext';
import {
  DEFAULT_DARK_THEME_KEY,
  ThemeRegistrationData,
  ThemeRegistrationStorageData,
} from './ThemeModel';
import {
  calculatePreloadStyleContent,
  getActiveThemes,
  getThemePreloadData,
  mapThemeRegistrationData,
  setThemePreloadData,
} from './ThemeUtils';

const log = Log.module('useInitializeThemeContextValue');

/**
 * Initialize a `ThemeContextValue`.
 */
export function useInitializeThemeContextValue(): ThemeContextValue {
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>(
    () => getThemePreloadData()?.themeKey ?? DEFAULT_DARK_THEME_KEY
  );

  const [themeRegistration, setThemeRegistration] =
    useState<ThemeRegistrationStorageData | null>(null);

  const activeThemes = useMemo(
    () =>
      themeRegistration == null
        ? null
        : getActiveThemes(selectedThemeKey, themeRegistration),
    [selectedThemeKey, themeRegistration]
  );

  /**
   * Register the given custom themes with the cache and activate theming.
   */
  const registerThemes = useCallback(
    (themeRegistrationData: ThemeRegistrationData) => {
      setThemeRegistration(mapThemeRegistrationData(themeRegistrationData));
    },
    []
  );

  // Once themes are activated, cache the preload data for next time page is
  // refreshed.
  useEffect(() => {
    if (activeThemes == null) {
      return;
    }

    log.debug(
      'Active themes:',
      activeThemes.map(theme => theme.themeKey)
    );

    setThemePreloadData({
      themeKey: selectedThemeKey,
      preloadStyleContent: calculatePreloadStyleContent(),
    });
  }, [activeThemes, selectedThemeKey, themeRegistration]);

  return useMemo(
    () => ({
      activeThemes,
      selectedThemeKey,
      registerThemes,
      setSelectedThemeKey,
    }),
    [activeThemes, registerThemes, selectedThemeKey]
  );
}

export default useInitializeThemeContextValue;
