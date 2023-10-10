export type BaseThemeType = 'dark' | 'light';
export type BaseThemeKey = `default-${BaseThemeType}`;
export type ThemePreloadStyleContent = `:root{${string}`;

export const DEFAULT_DARK_THEME_KEY = 'default-dark' satisfies BaseThemeKey;
export const DEFAULT_LIGHT_THEME_KEY = 'default-light' satisfies BaseThemeKey;

// Css properties that are used in preload data with default values.
export const DEFAULT_PRELOAD_DATA_VARIABLES = {
  '--dh-color-accent': '#4c7dee', // dark theme --dh-color-blue-700
  '--dh-color-background': '#1a171a', // dark theme --dh-color-gray-50
} satisfies Record<`--dh-${string}`, string>;

export const THEME_CACHE_LOCAL_STORAGE_KEY = 'deephaven.themeCache';

export interface ThemePreloadData {
  themeKey: string;
  preloadStyleContent?: ThemePreloadStyleContent;
}

export interface ThemeData {
  baseThemeKey?: BaseThemeKey;
  themeKey: string;
  name: string;
  styleContent: string;
}

export interface ThemeRegistrationData {
  base: ThemeData[];
  custom: ThemeData[];
}
