import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Log from '@deephaven/log';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { ThemeCache, useThemeCache } from './ThemeCache';
import { DEFAULT_DARK_THEME_KEY, ThemeData } from './ThemeModel';

const log = Log.module('ThemeContext');

export interface ThemeContextValue {
  activeThemes: ThemeData[] | null;
  cache: ThemeCache;
  isActive: boolean;
  registerCustomThemesAndActivate: (additionalThemeData: ThemeData[]) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Hook to get the current `ThemeContextValue`.
 */
export function useTheme(): ThemeContextValue {
  return useContextOrThrow(
    ThemeContext,
    'No ThemeContext value found. Component must be wrapped in a ThemeContext.Provider'
  );
}

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
  // memoization internally.
  const activeThemes = isActive ? cache.getSelectedThemes() : null;

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

    cache.setSelectedTheme(
      activeThemes?.at(-1)?.themeKey ?? DEFAULT_DARK_THEME_KEY
    );
  }, [activeThemes, cache, isActive]);

  return useMemo(
    () => ({ activeThemes, cache, isActive, registerCustomThemesAndActivate }),
    [activeThemes, cache, isActive, registerCustomThemesAndActivate]
  );
}
