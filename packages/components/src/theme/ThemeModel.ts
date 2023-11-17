export type BaseThemeType = 'dark' | 'light';
export type BaseThemeKey = `default-${BaseThemeType}`;
export type CssVariableStyleContent = `:root{${string}`;
export type ThemeIconVariable =
  | '--dh-svg-icon-close-tab'
  | '--dh-svg-icon-maximise'
  | '--dh-svg-icon-tab-dropdown'
  | '--dh-svg-icon-search-cancel'
  | '--dh-svg-icon-select-indicator';

export const DEFAULT_DARK_THEME_KEY = 'default-dark' satisfies BaseThemeKey;
export const DEFAULT_LIGHT_THEME_KEY = 'default-light' satisfies BaseThemeKey;

// Css properties that are used in preload data with default values.
export const DEFAULT_PRELOAD_COLOR_VARIABLES = {
  '--dh-color-loading-spinner-primary': '#3b6bda', // dark theme --dh-color-blue-600
  '--dh-color-loading-spinner-secondary': '#f0f0ee80', // dark theme --dh-color-gray-800 + 50% opacity
  '--dh-color-background': '#1a171a', // dark theme --dh-color-gray-50
  '--dh-color-foreground': '#f0f0ee', // dark theme --dh-color-gray-800
} satisfies Record<`--dh-${string}`, string>;

export type ThemePreloadColorVariable =
  keyof typeof DEFAULT_PRELOAD_COLOR_VARIABLES;

export const THEME_CACHE_LOCAL_STORAGE_KEY = 'deephaven.themeCache';

export interface ThemePreloadData {
  themeKey: string;
  preloadStyleContent?: CssVariableStyleContent;
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
