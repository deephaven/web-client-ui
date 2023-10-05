import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import shortid from 'shortid';
// Note that ?inline imports are natively supported by Vite, but consumers of
// @deephaven/components using Webpack will need to add a rule to their module
// config.
// e.g.
// module: {
//  rules: [
//    {
//      resourceQuery: /inline/,
//      type: 'asset/source',
//    },
//  ],
// },
import darkThemePalette from './theme_default_dark_palette.css?inline';
import darkThemeSemantic from './theme_default_dark_semantic.css?inline';
import lightTheme from './theme_default_light.css?inline';
import {
  DEFAULT_DARK_THEME_KEY,
  DEFAULT_LIGHT_THEME_KEY,
  DEFAULT_PRELOAD_DATA_VARIABLES,
  ThemeData,
  ThemePreloadData,
  ThemePreloadStyleContent,
  ThemeRegistrationData,
  THEME_CACHE_LOCAL_STORAGE_KEY,
} from './ThemeModel';

const log = Log.module('ThemeUtils');

/**
 * Attempt to get the rgb or rgba string for a color string. If the color string
 * can't be resolved to a valid color, null is returned.
 * @param colorString The color string to resolve
 */
export function asRgbOrRgbaString(colorString: string): string | null {
  const divEl = document.createElement('div');
  divEl.style.backgroundColor = colorString;

  if (divEl.style.backgroundColor === '') {
    return null;
  }

  return divEl.style.backgroundColor;
}

/**
 * Creates a string containing preload style content for the current theme.
 * This resolves the current values of a few CSS variables that can be used
 * to style the page before the theme is loaded on next page load.
 */
export function calculatePreloadStyleContent(): ThemePreloadStyleContent {
  const bodyStyle = getComputedStyle(document.body);

  // Calculate the current preload variables. If the variable is not set, use
  // the default value.
  const pairs = Object.entries(DEFAULT_PRELOAD_DATA_VARIABLES).map(
    ([key, defaultValue]) =>
      `${key}:${bodyStyle.getPropertyValue(key) || defaultValue}`
  );

  return `:root{${pairs.join(';')}}`;
}

/**
 * Returns an array of the active themes. The first item will always be one
 * of the base themes. Optionally, the second item will be a custom theme.
 */
export function getActiveThemes(
  themeKey: string,
  themeRegistration: ThemeRegistrationData
): [ThemeData] | [ThemeData, ThemeData] {
  const custom = themeRegistration.custom.find(
    theme => theme.themeKey === themeKey
  );

  const baseThemeKey = custom?.baseThemeKey ?? themeKey;

  let base = themeRegistration.base.find(
    theme => theme.themeKey === baseThemeKey
  );

  if (base == null) {
    log.error(
      `No registered base theme found for theme key: '${baseThemeKey}'`,
      'Registered:',
      themeRegistration.base.map(theme => theme.themeKey),
      themeRegistration.custom.map(theme => theme.themeKey)
    );
    base = themeRegistration.base.find(
      theme => theme.themeKey === DEFAULT_DARK_THEME_KEY
    );

    assertNotNull(
      base,
      `Default base theme '${DEFAULT_DARK_THEME_KEY}' is not registered`
    );
  }

  log.debug('Applied themes:', base.themeKey, custom?.themeKey);

  return custom == null ? [base] : [base, custom];
}

/**
 * Get default base theme data.
 */
export function getDefaultBaseThemes(): ThemeData[] {
  return [
    {
      name: 'Default Dark',
      themeKey: DEFAULT_DARK_THEME_KEY,
      styleContent: [darkThemePalette, darkThemeSemantic].join('\n'),
    },
    {
      name: 'Default Light',
      themeKey: DEFAULT_LIGHT_THEME_KEY,
      styleContent: lightTheme,
    },
  ];
}

/**
 * Get the preload data from local storage or null if it does not exist or is
 * invalid
 */
export function getThemePreloadData(): ThemePreloadData | null {
  const data = localStorage.getItem(THEME_CACHE_LOCAL_STORAGE_KEY);

  try {
    return data == null ? null : JSON.parse(data);
  } catch {
    // ignore
  }

  return null;
}

/**
 * Normalize a css color to 8 character hex value. If the color can't be resolved,
 * return the original color string.
 * @param colorString The color string to normalize
 */
export function normalizeCssColor(colorString: string): string {
  const maybeRgbOrRgba = asRgbOrRgbaString(colorString);
  if (maybeRgbOrRgba == null) {
    return colorString;
  }

  const rgba = parseRgba(maybeRgbOrRgba);
  if (rgba === null) {
    return colorString;
  }

  return rgbaToHex8(rgba);
}

/**
 * Parse a given `rgb` or `rgba` css expression into its constituent r, g, b, a
 * values. If the expression cannot be parsed, it will return null.
 * Note that this parser is more permissive than the CSS spec and shouldn't be
 * relied on as a full validation mechanism. For the most part, it assumes that
 * the input is already a valid rgb or rgba expression.
 *
 * e.g. `rgb(255, 255, 255)` -> `{ r: 255, g: 255, b: 255, a: 1 }`
 * e.g. `rgba(255, 255, 255, 0.5)` -> `{ r: 255, g: 255, b: 255, a: 0.5 }`
 * @param rgbOrRgbaString The rgb or rgba string to parse
 */
export function parseRgba(
  rgbOrRgbaString: string
): { r: number; g: number; b: number; a: number } | null {
  const [, name, args] = /^(rgba?)\((.*?)\)$/.exec(rgbOrRgbaString) ?? [];
  if (name == null) {
    return null;
  }

  // Split on spaces, commas, and slashes. Note that this more permissive than
  // the CSS spec in that slashes should only be used to delimit the alpha value
  // (e.g. r g b / a), but this would match r/g/b/a. It also would match a mixed
  // delimiter case (e.g. r,g b,a). This seems like a reasonable tradeoff for the
  // complexity that would be added to enforce the full spec.
  const tokens = args.split(/[ ,/]/).filter(Boolean);

  if (tokens.length < 3) {
    return null;
  }

  const [r, g, b, a = 1] = tokens.map(Number);

  return {
    r,
    g,
    b,
    a,
  };
}

/**
 * Make a copy of the given object replacing any css variables contained in its
 * prop values with values resolved from the given HTML element.
 * @param obj An object whose values may contain css var expressions
 * @param el The element to resolve css variables against. Defaults to document.body
 */
export function replaceCssVariablesWithResolvedValues<
  T extends Record<string, string>,
>(obj: T, el: HTMLElement = document.body): T {
  const prefix = shortid();
  const computedStyle = getComputedStyle(el);

  const result = {} as T;

  Object.entries(obj).forEach(([key, value]) => {
    if (!value.includes('var(--')) {
      result[key as keyof T] = value as T[keyof T];
      return;
    }

    const tmpPropKey = `--${prefix}-${key}`;
    el.style.setProperty(tmpPropKey, value);

    const resolved = computedStyle.getPropertyValue(tmpPropKey);
    const normalized = normalizeCssColor(resolved);
    log.debug('Replaced css variables:', value, normalized);

    el.style.removeProperty(tmpPropKey);

    result[key as keyof T] = normalized as T[keyof T];
  });

  return result;
}

/**
 * Convert an rgba object to an 8 character hex color string.
 * @param r The red value
 * @param g The green value
 * @param b The blue value
 * @param a The alpha value (defaults to 1)
 * @returns The a character hex string with # prefix
 */
export function rgbaToHex8({
  r,
  g,
  b,
  a = 1,
}: {
  r: number;
  g: number;
  b: number;
  a?: number;
}): string {
  // eslint-disable-next-line no-param-reassign
  a = Math.round(a * 255);

  const [rh, gh, bh, ah] = [r, g, b, a].map(v =>
    v.toString(16).padStart(2, '0')
  );

  return `#${rh}${gh}${bh}${ah}`;
}

/**
 * Store theme preload data in local storage.
 * @param preloadData The preload data to set
 */
export function setThemePreloadData(preloadData: ThemePreloadData): void {
  localStorage.setItem(
    THEME_CACHE_LOCAL_STORAGE_KEY,
    JSON.stringify(preloadData)
  );
}

/**
 * Derive unique theme key from plugin root path and theme name.
 * @param pluginName The root path of the plugin
 * @param themeName The name of the theme
 */
export function getThemeKey(pluginName: string, themeName: string): string {
  return `${pluginName}_${themeName}`;
}

/**
 * Preload minimal theme variables from the cache.
 */
export function preloadTheme(): void {
  const preloadStyleContent =
    getThemePreloadData()?.preloadStyleContent ??
    calculatePreloadStyleContent();

  log.debug('Preloading theme content:', `'${preloadStyleContent}'`);

  const style = document.createElement('style');
  style.innerHTML = preloadStyleContent;
  document.head.appendChild(style);
}
