import {
  createContext,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import { DEFAULT_PRELOAD_DATA_VARIABLES, type ThemeData } from './ThemeModel';
import {
  calculatePreloadStyleContent,
  getActiveThemes,
  getDefaultBaseThemes,
  setThemePreloadData,
  overrideSVGFillColors,
  getDefaultSelectedThemeKey,
} from './ThemeUtils';
import { SpectrumThemeProvider } from './SpectrumThemeProvider';
import './theme-svg.scss';
import useParentWindowTheme from './useParentWindowTheme';

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
  defaultPreloadValues?: Record<string, string>;
  children: ReactNode;
}

export function ThemeProvider({
  themes: propThemes,
  defaultPreloadValues = DEFAULT_PRELOAD_DATA_VARIABLES,
  children,
}: ThemeProviderProps): JSX.Element | null {
  const baseThemes = useMemo(() => getDefaultBaseThemes(), []);

  const {
    isEnabled: isParentThemeEnabled,
    isPending: isParentThemePending,
    themeData: parentThemeData,
  } = useParentWindowTheme();

  const [value, setValue] = useState<ThemeContextValue | null>(null);

  const [selectedThemeKey, setSelectedThemeKey] = useState<string>(
    getDefaultSelectedThemeKey
  );

  /**
   * Custom themes can be provided via props or by a `postMessage` from the
   * parent window. In either case, the themes may get loaded asynchronously.
   * A `null` value indicates that the themes are still being loaded. e.g.
   * plugins that provide themes after login may provide custom themes via props,
   * while `postMessage` apis are by nature asynchronous.
   * Note prop themes are ignored when parent themes are enabled.
   */
  const customThemes = useMemo(() => {
    // Custom theme provided by `postMessage` from the parent window.
    if (isParentThemeEnabled && !isParentThemePending) {
      return parentThemeData ? [parentThemeData] : [];
    }

    // Custom themes provided by props.
    if (!isParentThemeEnabled) {
      return propThemes;
    }

    return null;
  }, [isParentThemeEnabled, isParentThemePending, parentThemeData, propThemes]);

  // Calculate active themes once custom themes are loaded
  const activeThemes = useMemo(() => {
    if (isParentThemeEnabled && isParentThemePending) {
      return null;
    }

    // Give plugins a chance to provide custom themes.
    if (!isParentThemeEnabled && customThemes == null) {
      return null;
    }

    let custom: ThemeData[];

    if (isParentThemeEnabled) {
      custom = parentThemeData ? [parentThemeData] : [];
    } else {
      assertNotNull(customThemes);
      custom = customThemes;
    }

    return getActiveThemes(selectedThemeKey, {
      base: baseThemes,
      custom,
    });
  }, [
    isParentThemeEnabled,
    isParentThemePending,
    customThemes,
    selectedThemeKey,
    baseThemes,
    parentThemeData,
  ]);

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
      overrideSVGFillColors(defaultPreloadValues);

      const preloadStyleContent =
        calculatePreloadStyleContent(defaultPreloadValues);

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
    [activeThemes, selectedThemeKey, customThemes, defaultPreloadValues]
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
