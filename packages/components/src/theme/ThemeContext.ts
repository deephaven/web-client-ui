import { createContext } from 'react';
import { ThemeCache } from './ThemeCache';
import { ThemeData } from './ThemeModel';

export interface ThemeContextValue {
  activeThemes: ThemeData[] | null;
  cache: ThemeCache;
  registerCustomThemesAndActivate: (additionalThemeData: ThemeData[]) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export default ThemeContext;
