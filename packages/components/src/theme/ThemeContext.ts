import { createContext } from 'react';
import { ThemeData, ThemeRegistrationData } from './ThemeModel';

export interface ThemeContextValue {
  activeThemes: ThemeData[] | null;
  selectedThemeKey: string;
  setSelectedThemeKey: (themeKey: string) => void;
  registerThemes: (themeRegistrationData: ThemeRegistrationData) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export default ThemeContext;
