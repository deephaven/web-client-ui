import React from 'react';
import { type GridTheme as GridThemeType } from './GridTheme';

export type ThemeContextValue = Partial<GridThemeType>;

export const ThemeContext: React.Context<ThemeContextValue> =
  React.createContext({});

export default ThemeContext;
