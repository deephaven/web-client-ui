import { createContext, ReactNode, useEffect, useMemo, useState } from 'react';
import Log from '@deephaven/log';
import {
  CssVariableStyleContent,
  DEFAULT_DARK_THEME_KEY,
  ThemeData,
} from './ThemeModel';
import {
  calculateInlineSVGOverrides,
  calculatePreloadColorStyleContent,
  getActiveThemes,
  getDefaultBaseThemes,
  getThemePreloadData,
  setThemePreloadData,
} from './ThemeUtils';
import { SpectrumThemeProvider } from './SpectrumThemeProvider';
import inlineSVGs from './theme-svg.css?raw';

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
   * tell the provider to activate the base themes.
   */
  themes: ThemeData[] | null;
  children: ReactNode;
}

export function ThemeProvider({
  themes,
  children,
}: ThemeProviderProps): JSX.Element {
  const baseThemes = useMemo(() => getDefaultBaseThemes(), []);

  const [inlineSVGOverrides, setInlineSVGOverrides] =
    useState<CssVariableStyleContent | null>(null);

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

      const newInlineSVGStyleContent = calculateInlineSVGOverrides();
      const preloadColorStyleContent = calculatePreloadColorStyleContent();

      const preloadStyleContent = [
        preloadColorStyleContent,
        newInlineSVGStyleContent,
      ].join(' ') as CssVariableStyleContent;

      log.debug2('updateThemePreloadData:', {
        active: activeThemes.map(theme => theme.themeKey),
        all: themes.map(theme => theme.themeKey),
        preloadStyleContent,
        selectedThemeKey,
      });

      setInlineSVGOverrides(newInlineSVGStyleContent);

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
          <style id="dh-inline-svg">{inlineSVGs}</style>
          {inlineSVGOverrides == null ? null : (
            <style id="dh-inline-svg-overrides">{inlineSVGOverrides}</style>
          )}
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
