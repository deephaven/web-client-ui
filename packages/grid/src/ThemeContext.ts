import React from 'react';
import GridTheme, { GridTheme as GridThemeType } from './GridTheme';

export const ThemeContext: React.Context<
  Partial<GridThemeType>
> = React.createContext(GridTheme as Partial<GridThemeType>);

export default ThemeContext;
