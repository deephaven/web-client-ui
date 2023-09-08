import React from 'react';
import { GridTheme as GridThemeType } from './GridTheme';

export const ThemeContext: React.Context<Partial<GridThemeType>> =
  React.createContext({});

export default ThemeContext;
