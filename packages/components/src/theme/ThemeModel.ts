export type BaseThemeType = 'dark' | 'light';
export type BaseThemeKey = `default-${BaseThemeType}`;
export type ThemePreloadStyleContent = `:root{${string}`;

export const DEFAULT_THEME_KEY = 'default-dark' satisfies BaseThemeKey;

export interface ThemePreloadData {
  baseThemeKey?: BaseThemeKey;
  themeKey: string;
  preloadStyleContent?: ThemePreloadStyleContent;
}

export interface ThemeData {
  baseThemeKey?: BaseThemeKey;
  themeKey: string;
  name: string;
  styleContent: string;
}
