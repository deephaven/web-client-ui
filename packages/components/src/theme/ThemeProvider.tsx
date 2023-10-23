import { createContext, ReactNode, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import { DEFAULT_DARK_THEME_KEY, ThemeData } from './ThemeModel';
import {
  calculatePreloadStyleContent,
  getActiveThemes,
  getDefaultBaseThemes,
  getThemePreloadData,
  setThemePreloadData,
} from './ThemeUtils';
import { SpectrumThemeProvider } from './SpectrumThemeProvider';

export interface ThemeContextValue {
  activeThemes: ThemeData[] | null;
  selectedThemeKey: string;
  setSelectedThemeKey: (themeKey: string) => void;
}

const log = Log.module('ThemeProvider');

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  themes: ThemeData[] | null;
  children: ReactNode;
}

export function ThemeProvider({
  themes,
  children,
}: ThemeProviderProps): JSX.Element {
  const baseThemes = useMemo(() => getDefaultBaseThemes(), []);

  const [selectedThemeKey, setSelectedThemeKey] = useState<string>(
    () => getThemePreloadData()?.themeKey ?? DEFAULT_DARK_THEME_KEY
  );

  const activeThemes = useMemo(
    () =>
      // Themes remain inactive until a non-null themes array is provided. This
      // avoids the default base theme overriding the preload if we are waiting
      // on additional themes to be available.
      themes == null
        ? null
        : getActiveThemes(selectedThemeKey, {
            base: baseThemes,
            custom: themes ?? [],
          }),
    [baseThemes, selectedThemeKey, themes]
  );

  useEffect(
    function updateThemePreloadData() {
      log.debug('Active themes:', activeThemes?.map(theme => theme.themeKey));

      setThemePreloadData({
        themeKey: selectedThemeKey,
        preloadStyleContent: calculatePreloadStyleContent(),
      });
    },
    [activeThemes, selectedThemeKey]
  );

  const value = useMemo(
    () => ({
      activeThemes,
      selectedThemeKey,
      setSelectedThemeKey,
    }),
    [activeThemes, selectedThemeKey]
  );

  return (
    <ThemeContext.Provider value={value}>
      {activeThemes == null ? null : (
        <>
          {activeThemes.map(theme => (
            <style data-theme-key={theme.themeKey} key={theme.themeKey}>
              {theme.styleContent}
            </style>
          ))}
          <SpectrumThemeProvider>{children}</SpectrumThemeProvider>
        </>
      )}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
