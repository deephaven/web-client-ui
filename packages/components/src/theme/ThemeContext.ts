import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useContextOrThrow } from '@deephaven/react-hooks';
import { ThemeCache, useThemeCache } from './ThemeCache';
import { DEFAULT_DARK_THEME_KEY, ThemeData } from './ThemeModel';

export interface ThemeContextValue {
  activeThemes: ThemeData[] | null;
  cache: ThemeCache;
  isActive: boolean;
  registerCustomThemesAndActivate: (additionalThemeData: ThemeData[]) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  return useContextOrThrow(
    ThemeContext,
    'No ThemeContext value found. Component must be wrapped in a ThemeContext.Provider'
  );
}

export function useInitializeThemeContextValue(): ThemeContextValue {
  const cache = useThemeCache();
  const [, setCacheTick] = useState(0);

  const [isActive, setIsActive] = useState(false);

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
        setCacheTick(i => i + 1);
      }),
    [cache]
  );

  // Set selected themes when theming is activated
  useEffect(() => {
    if (!isActive) {
      return;
    }

    cache.setSelectedTheme(
      activeThemes?.at(-1)?.themeKey ?? DEFAULT_DARK_THEME_KEY
    );
  }, [activeThemes, cache, isActive]);

  return useMemo(
    () => ({ activeThemes, cache, isActive, registerCustomThemesAndActivate }),
    [activeThemes, cache, isActive, registerCustomThemesAndActivate]
  );
}
