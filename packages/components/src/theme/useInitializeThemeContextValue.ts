import { useCallback, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import { ThemeContextValue } from './ThemeProvider';
import {
  DEFAULT_DARK_THEME_KEY,
  ThemeData,
  ThemeRegistrationData,
} from './ThemeModel';
import {
  calculatePreloadStyleContent,
  getActiveThemes,
  getDefaultBaseThemes,
  getThemePreloadData,
  setThemePreloadData,
} from './ThemeUtils';

const log = Log.module('useInitializeThemeContextValue');

/**
 * Initialize a `ThemeContextValue`.
 */
export function useInitializeThemeContextValue(): ThemeContextValue {
  const baseThemes = useMemo(() => getDefaultBaseThemes(), []);
  const [customThemes, setCustomThemes] = useState<ThemeData[] | null>(null);

  const [selectedThemeKey, setSelectedThemeKey] = useState<string>(
    () => getThemePreloadData()?.themeKey ?? DEFAULT_DARK_THEME_KEY
  );

  const activeThemes = useMemo(
    () =>
      getActiveThemes(selectedThemeKey, {
        base: baseThemes,
        custom: customThemes ?? [],
      }),
    [baseThemes, customThemes, selectedThemeKey]
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
  }, [activeThemes, selectedThemeKey]);

  return useMemo(
    () => ({
      activeThemes,
      selectedThemeKey,
      registerThemes: setCustomThemes,
      setSelectedThemeKey,
    }),
    [activeThemes, selectedThemeKey]
  );
}

export default useInitializeThemeContextValue;
