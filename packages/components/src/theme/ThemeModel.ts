export type BaseThemeType = 'dark' | 'light';
export type BaseThemeKey = `default-${BaseThemeType}`;
export type ThemePreloadStyleContent = `:root{${string}`;

export const DEFAULT_DARK_THEME_KEY = 'default-dark' satisfies BaseThemeKey;
export const DEFAULT_LIGHT_THEME_KEY = 'default-light' satisfies BaseThemeKey;

// Css properties that are used in preload data with default values.
export const DEFAULT_PRELOAD_DATA_VARIABLES = {
  '--dh-color-loading-spinner-primary': '#3b6bda', // dark theme --dh-color-blue-600
  '--dh-color-loading-spinner-secondary': '#f0f0ee80', // dark theme --dh-color-gray-800 + 50% opacity
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
