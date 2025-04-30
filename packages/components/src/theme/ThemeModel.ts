export type BaseThemeType = 'dark' | 'light';
export type BaseThemeKey = `default-${BaseThemeType}`;
export type CssVariableStyleContent = `:root{${string}`;
export type ThemeCssVariableName = `--dh-${string}`;
export type ThemeCssColorVariableName = `--dh-color-${string}`;

// DHC should only need to preload variables that are required by the empty page
// with loading spinner that shows while plugins are loading. The rest of the
// preload variables defined here are required by DHE due to theme plugins
// loading after login. We should consider moving most of these to the DHE
// codebase. To be addressed by #1679
export type ThemePreloadColorVariable =
  | '--dh-color-accent-contrast'
  | '--dh-color-accent-bg'
  | '--dh-color-accent-hover-bg'
  | '--dh-color-accent-down-bg'
  | '--dh-color-accent-key-focus-bg'
  | '--dh-color-negative-bg'
  | '--dh-color-loading-spinner-primary'
  | '--dh-color-loading-spinner-secondary'
  | '--dh-color-bg'
  | '--dh-color-fg'
  | '--dh-color-input-bg'
  | '--dh-color-input-fg'
  | '--dh-color-input-disabled-bg'
  | '--dh-color-input-border'
  | '--dh-color-input-placeholder'
  | '--dh-color-input-focus-border'
  | '--dh-color-text-highlight'
  | '--dh-color-login-form-bg'
  | '--dh-color-login-status-message'
  | '--dh-color-login-logo-bg'
  | '--dh-color-login-footer-fg'
  | '--dh-color-random-area-plot-animation-fg-fill'
  | '--dh-color-random-area-plot-animation-fg-stroke'
  | '--dh-color-random-area-plot-animation-bg'
  | '--dh-color-random-area-plot-animation-grid';

export type ThemeIconsRequiringManualColorChanges =
  | '--dh-svg-icon-select-indicator'
  | '--dh-svg-icon-select-indicator-hover'
  | '--dh-svg-icon-select-indicator-disabled'
  | '--dh-svg-icon-error';

export const DEFAULT_DARK_THEME_KEY = 'default-dark' satisfies BaseThemeKey;
export const DEFAULT_LIGHT_THEME_KEY = 'default-light' satisfies BaseThemeKey;
export const PARENT_THEME_KEY = 'parent-theme' as const;
export const PARENT_THEME_REQUEST = 'io.deephaven.message.ParentTheme.request';
export const PRELOAD_TRANSPARENT_THEME_QUERY_PARAM =
  'preloadTransparentTheme' as const;
export const THEME_KEY_OVERRIDE_QUERY_PARAM = 'theme' as const;

// Hex versions of some of the default dark theme color palette needed for
// preload defaults.
export const DEFAULT_DARK_THEME_PALETTE = {
  blue: {
    500: '#2f5bc0',
    400: '#254ba4',
    600: '#3b6bda', // accent color
    700: '#4c7dee',
  },
  red: {
    600: '#c73f61',
  },
  gray: {
    50: '#1a171a',
    75: '#211f22',
    300: '#373438',
    400: '#403e41',
    500: '#5b5a5c',
    600: '#929192',
    700: '#c0bfbf',
    800: '#f0f0ee',
    900: '#fcfcfa',
  },
} as const;

// Css properties that are used in preload data with default values.
// DHC should only need to preload variables that are required by the empty page
// with loading spinner that shows while plugins are loading. The rest of the
// preload variables defined here are required by DHE due to theme plugins
// loading after login. We should consider moving most of these to the DHE
// codebase. To be addressed by #1679
export const DEFAULT_PRELOAD_DATA_VARIABLES: Record<
  ThemePreloadColorVariable,
  string
> = {
  '--dh-color-accent-contrast': DEFAULT_DARK_THEME_PALETTE.gray[900],
  '--dh-color-accent-bg': DEFAULT_DARK_THEME_PALETTE.blue[600],
  '--dh-color-accent-hover-bg': DEFAULT_DARK_THEME_PALETTE.blue[500],
  '--dh-color-accent-down-bg': DEFAULT_DARK_THEME_PALETTE.blue[400],
  '--dh-color-accent-key-focus-bg': DEFAULT_DARK_THEME_PALETTE.blue[500],
  '--dh-color-negative-bg': DEFAULT_DARK_THEME_PALETTE.red[600],
  '--dh-color-loading-spinner-primary': DEFAULT_DARK_THEME_PALETTE.blue[600],
  '--dh-color-loading-spinner-secondary': `${DEFAULT_DARK_THEME_PALETTE.gray[800]}80`, // 50% opacity
  '--dh-color-bg': DEFAULT_DARK_THEME_PALETTE.gray[50],
  '--dh-color-fg': DEFAULT_DARK_THEME_PALETTE.gray[800],
  '--dh-color-input-bg': DEFAULT_DARK_THEME_PALETTE.gray[500],
  '--dh-color-input-fg': DEFAULT_DARK_THEME_PALETTE.gray[800],
  '--dh-color-input-disabled-bg': DEFAULT_DARK_THEME_PALETTE.gray[300],
  '--dh-color-input-border': DEFAULT_DARK_THEME_PALETTE.gray[600],
  '--dh-color-input-placeholder': DEFAULT_DARK_THEME_PALETTE.gray[600],
  '--dh-color-input-focus-border': `${DEFAULT_DARK_THEME_PALETTE.blue[600]}d9`, // 85% opacity
  '--dh-color-text-highlight': `${DEFAULT_DARK_THEME_PALETTE.blue[700]}4d`, // 30% opacity
  '--dh-color-login-form-bg': DEFAULT_DARK_THEME_PALETTE.gray[400],
  '--dh-color-login-status-message': DEFAULT_DARK_THEME_PALETTE.gray[600],
  '--dh-color-login-logo-bg': DEFAULT_DARK_THEME_PALETTE.gray[900],
  '--dh-color-login-footer-fg': DEFAULT_DARK_THEME_PALETTE.gray[700],
  '--dh-color-random-area-plot-animation-fg-fill': `${DEFAULT_DARK_THEME_PALETTE.blue[600]}14`, // .08 opacity
  '--dh-color-random-area-plot-animation-fg-stroke': `${DEFAULT_DARK_THEME_PALETTE.blue[600]}33`, // .2 opacity
  '--dh-color-random-area-plot-animation-bg':
    DEFAULT_DARK_THEME_PALETTE.gray[75],
  '--dh-color-random-area-plot-animation-grid':
    DEFAULT_DARK_THEME_PALETTE.gray[300],
};

export const TRANSPARENT_PRELOAD_DATA_VARIABLES: Partial<
  Record<ThemePreloadColorVariable, string>
> = {
  '--dh-color-bg': 'transparent',
  '--dh-color-loading-spinner-primary': 'transparent',
  '--dh-color-loading-spinner-secondary': 'transparent',
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

export interface ParentThemeData {
  baseThemeKey?: BaseThemeKey;
  name: string;
  cssVars: Record<ThemeCssColorVariableName, string>;
}
