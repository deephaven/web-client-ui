import { createContext } from 'react';
import { ThemeCache } from './ThemeCache';
import { ThemeData } from './ThemeModel';

export interface ThemeContextValue {
  activeThemes: ThemeData[] | null;
  cache: ThemeCache;
  isActive: boolean;
  registerCustomThemesAndActivate: (additionalThemeData: ThemeData[]) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export default ThemeContext;
