export type BaseThemeType = 'dark' | 'light';
export type BaseThemeKey = `default-${BaseThemeType}`;
export type CssVariableStyleContent = `:root{${string}`;
export type ThemeCssVariableName = `--dh-${string}`;

export type ThemePreloadColorVariable =
  | '--dh-color-accent-contrast'
  | '--dh-color-accent-bg'
  | '--dh-color-accent-hover-bg'
  | '--dh-color-accent-down-bg'
  | '--dh-color-accent-key-focus-bg'
  | '--dh-color-login-form-bg'
  | '--dh-color-login-status-message'
  | '--dh-color-random-area-plot-animation-fg-fill'
  | '--dh-color-random-area-plot-animation-fg-stroke'
  | '--dh-color-random-area-plot-animation-bg'
  | '--dh-color-random-area-plot-animation-grid'
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
  | '--dh-color-input-focus-border';

export type ThemeIconsRequiringManualColorChanges =
  | '--dh-svg-icon-select-indicator'
  | '--dh-svg-icon-select-indicator-hover'
  | '--dh-svg-icon-select-indicator-disabled'
  | '--dh-svg-icon-error';

export interface RandomAreaPlotAnimationThemeColors {
  background: string;
  foregroundFill: string;
  foregroundStroke: string;
  gridColor: string;
}

export const DEFAULT_DARK_THEME_KEY = 'default-dark' satisfies BaseThemeKey;
export const DEFAULT_LIGHT_THEME_KEY = 'default-light' satisfies BaseThemeKey;

// Hex versions of some of the default dark theme color palette needed for
// preload defaults.
const DEFAULT_DARK_THEME_PALETTE = {
  blue: {
    500: '#2f5bc0',
    400: '#254ba4',
    600: '#3b6bda', // accent color
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
    800: '#f0f0ee',
    900: '#fcfcfa',
  },
} as const;

// Css properties that are used in preload data with default values.
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
  '--dh-color-login-form-bg': DEFAULT_DARK_THEME_PALETTE.gray[400],
  '--dh-color-login-status-message': DEFAULT_DARK_THEME_PALETTE.gray[600],
  '--dh-color-random-area-plot-animation-fg-fill': `${DEFAULT_DARK_THEME_PALETTE.blue[600]}14`, // .08 opacity
  '--dh-color-random-area-plot-animation-fg-stroke': `${DEFAULT_DARK_THEME_PALETTE.blue[600]}33`, // .2 opacity
  '--dh-color-random-area-plot-animation-bg':
    DEFAULT_DARK_THEME_PALETTE.gray[75],
  '--dh-color-random-area-plot-animation-grid':
    DEFAULT_DARK_THEME_PALETTE.gray[300],
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
};

export const RANDOM_AREA_PLOT_ANIMATION_THEME_COLOR_VARIABLES = {
  background: 'var(--dh-color-random-area-plot-animation-bg)',
  foregroundFill: 'var(--dh-color-random-area-plot-animation-fg-fill)',
  foregroundStroke: 'var(--dh-color-random-area-plot-animation-fg-stroke)',
  gridColor: 'var(--dh-color-random-area-plot-animation-grid)',
} satisfies RandomAreaPlotAnimationThemeColors;

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
