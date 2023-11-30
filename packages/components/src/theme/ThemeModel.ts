export type BaseThemeType = 'dark' | 'light';
export type BaseThemeKey = `default-${BaseThemeType}`;
export type CssVariableStyleContent = `:root{${string}`;
export type ThemeCssVariableName = `--dh-${string}`;

export type ThemePreloadColorVariable =
  | '--dh-color-loading-spinner-primary'
  | '--dh-color-loading-spinner-secondary'
  | '--dh-color-background'
  | '--dh-color-foreground';

export type ThemeIconsRequiringManualColorChanges =
  | '--dh-svg-icon-select-indicator'
  | '--dh-svg-icon-select-indicator-hover'
  | '--dh-svg-icon-select-indicator-disabled'
  | '--dh-svg-icon-error';

export const DEFAULT_DARK_THEME_KEY = 'default-dark' satisfies BaseThemeKey;
export const DEFAULT_LIGHT_THEME_KEY = 'default-light' satisfies BaseThemeKey;

// Css properties that are used in preload data with default values.
export const DEFAULT_PRELOAD_DATA_VARIABLES: Record<
  ThemePreloadColorVariable,
  string
> = {
  '--dh-color-loading-spinner-primary': '#3b6bda', // dark theme --dh-color-blue-600
  '--dh-color-loading-spinner-secondary': '#f0f0ee80', // dark theme --dh-color-gray-800 + 50% opacity
  '--dh-color-background': '#1a171a', // dark theme --dh-color-gray-50
  '--dh-color-foreground': '#f0f0ee', // dark theme --dh-color-gray-800
};

/**
 * Some inline SVGs require manually updating their fill color via
 * `updateSVGFillColors`. This object maps these variables to their respective
 * fill color variables.
 */
export const SVG_ICON_MANUAL_COLOR_MAP: Record<
  ThemeIconsRequiringManualColorChanges,
  string
> = {
  '--dh-svg-icon-select-indicator': '--dh-color-selector-fg',
  '--dh-svg-icon-select-indicator-hover': '--dh-color-selector-hover-fg',
  '--dh-svg-icon-select-indicator-disabled': '--dh-color-selector-disabled-fg',
  '--dh-svg-icon-error': '--dh-color-form-control-error',
};

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
