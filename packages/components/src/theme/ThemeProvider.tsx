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
  /*
   * Additional themes to load in addition to the base themes. If no additional
   * themes are to be loaded, this must be set to an empty array in order to
   * tell the provider to activate themes and render children.
   */
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

  // Calculate active themes once a non-null themes array is provided.
  const activeThemes = useMemo(
    () =>
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
      // Don't update preload data until themes have been loaded and activated
      if (activeThemes == null || themes == null) {
        return;
      }

      const preloadStyleContent = calculatePreloadStyleContent();

      log.debug2('updateThemePreloadData:', {
        active: activeThemes.map(theme => theme.themeKey),
        all: themes.map(theme => theme.themeKey),
        preloadStyleContent,
        selectedThemeKey,
      });

      setThemePreloadData({
        themeKey: selectedThemeKey,
        preloadStyleContent,
      });
    },
    [activeThemes, selectedThemeKey, themes]
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
        </>
      )}
      <SpectrumThemeProvider>{children}</SpectrumThemeProvider>
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
