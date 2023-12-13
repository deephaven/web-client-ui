import { createContext, ReactNode, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import { DEFAULT_DARK_THEME_KEY, ThemeData } from './ThemeModel';
import {
  calculatePreloadStyleContent,
  getActiveThemes,
  getDefaultBaseThemes,
  getThemePreloadData,
  setThemePreloadData,
  overrideSVGFillColors,
} from './ThemeUtils';
import { SpectrumThemeProvider } from './SpectrumThemeProvider';
import './theme-svg.scss';

export interface ThemeContextValue {
  activeThemes: ThemeData[] | null;
  selectedThemeKey: string;
  themes: ThemeData[];
  setSelectedThemeKey: (themeKey: string) => void;
}

const log = Log.module('ThemeProvider');

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /*
   * Additional themes to load in addition to the base themes. If no additional
   * themes are to be loaded, this must be set to an empty array in order to
   * tell the provider to activate the base themes.
   */
  themes: ThemeData[] | null;
  children: ReactNode;
}

export function ThemeProvider({
  themes: customThemes,
  children,
}: ThemeProviderProps): JSX.Element | null {
  const baseThemes = useMemo(() => getDefaultBaseThemes(), []);

  const [value, setValue] = useState<ThemeContextValue | null>(null);

  const [selectedThemeKey, setSelectedThemeKey] = useState<string>(
    () => getThemePreloadData()?.themeKey ?? DEFAULT_DARK_THEME_KEY
  );

  // Calculate active themes once a non-null themes array is provided.
  const activeThemes = useMemo(
    () =>
      customThemes == null
        ? null
        : getActiveThemes(selectedThemeKey, {
            base: baseThemes,
            custom: customThemes ?? [],
          }),
    [baseThemes, selectedThemeKey, customThemes]
  );

  const themes = useMemo(
    () => [...baseThemes, ...(customThemes ?? [])],
    [baseThemes, customThemes]
  );

  useEffect(
    function updateThemePreloadData() {
      // Don't update preload data until themes have been loaded and activated
      if (activeThemes == null || customThemes == null) {
        return;
      }

      // Override fill color for certain inline SVGs (the originals are provided
      // by theme-svg.scss)
      overrideSVGFillColors();

      const preloadStyleContent = calculatePreloadStyleContent();

      log.debug2('updateThemePreloadData:', {
        active: activeThemes.map(theme => theme.themeKey),
        custom: customThemes.map(theme => theme.themeKey),
        preloadStyleContent,
        selectedThemeKey,
      });

      setThemePreloadData({
        themeKey: selectedThemeKey,
        preloadStyleContent,
      });
    },
    [activeThemes, selectedThemeKey, customThemes]
  );

  useEffect(() => {
    setValue({
      activeThemes,
      selectedThemeKey,
      themes,
      setSelectedThemeKey,
    });
  }, [activeThemes, selectedThemeKey, themes]);

  return (
    <>
      {activeThemes == null ? null : (
        <>
          {activeThemes.map(theme => (
            <style data-theme-key={theme.themeKey} key={theme.themeKey}>
              {theme.styleContent}
            </style>
          ))}
        </>
      )}
      {value == null ? null : (
        <ThemeContext.Provider value={value}>
          <SpectrumThemeProvider>{children}</SpectrumThemeProvider>
        </ThemeContext.Provider>
      )}
    </>
  );
}

export default ThemeProvider;
