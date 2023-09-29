import { createContext, ReactNode, useEffect } from 'react';
import { ThemeData } from './ThemeModel';
import useInitializeThemeContextValue from './useInitializeThemeContextValue';

export interface ThemeContextValue {
  activeThemes: ThemeData[] | null;
  selectedThemeKey: string;
  setSelectedThemeKey: (themeKey: string) => void;
  registerThemes: (themes: ThemeData[]) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export default ThemeContext;

export interface ThemeProviderProps {
  themes: ThemeData[] | null;
  children: ReactNode;
}

export function ThemeProvider({
  themes,
  children,
}: ThemeProviderProps): JSX.Element {
  const value = useInitializeThemeContextValue();
  const { registerThemes } = value;

  useEffect(() => {
    if (themes == null) {
      return;
    }

    registerThemes(themes);
  }, [themes, registerThemes]);

  return (
    <ThemeContext.Provider value={value}>
      {value.activeThemes?.map(theme => (
        <style data-theme-key={theme.themeKey} key={theme.themeKey}>
          {theme.styleContent}
        </style>
      ))}
      {children}
    </ThemeContext.Provider>
  );
}
