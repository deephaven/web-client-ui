import { useContextOrThrow } from '@deephaven/react-hooks';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeCache, useThemeCache } from './ThemeCache';
import type { ThemeData } from './ThemeModel';

export interface ThemeContextValue {
  activeThemes: ThemeData[] | null;
  cache: ThemeCache;
  isActive: boolean;
  activate: (additionalThemeData: ThemeData[]) => void;
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

  const activate = useCallback(
    (additionalThemeData: ThemeData[]) => {
      cache.registerCustomThemes(additionalThemeData);
      setIsActive(true);
    },
    [cache]
  );

  const activeThemes = isActive ? cache.getSelectedThemes() : null;

  useEffect(
    () =>
      cache.registerEventListener('change', () => {
        setCacheTick(i => i + 1);
      }),
    [cache]
  );

  useEffect(() => {
    if (!isActive) {
      return;
    }

    cache.setSelectedThemes(activeThemes?.at(-1)?.themeKey ?? 'default-dark');
  }, [activeThemes, cache, isActive]);

  return useMemo(
    () => ({ activate, activeThemes, cache, isActive }),
    [activate, activeThemes, cache, isActive]
  );
}
