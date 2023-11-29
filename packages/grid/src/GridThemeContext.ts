import React from 'react';
import { GridTheme as GridThemeType } from './GridTheme';

export type GridThemeContextValue = Partial<GridThemeType>;

export const GridThemeContext: React.Context<GridThemeContextValue> =
  React.createContext({});

export default GridThemeContext;
