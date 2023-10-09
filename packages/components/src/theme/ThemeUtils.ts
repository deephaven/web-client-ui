import Log from '@deephaven/log';
import { assertNotNull, ColorUtils } from '@deephaven/utils';
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

export const TMP_CSS_PROP_PREFIX = 'dh-tmp';

export type VarExpressionResolver = (varExpression: string) => string;

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
 * Extracts all css variable expressions from the given record and returns
 * a set of unique expressions.
 * @param record The record to extract css variable expressions from
 */
export function extractDistinctCssVariableExpressions(
  record: Record<string, string>
): Set<string> {
  const set = new Set<string>();

  Object.values(record).forEach(value => {
    getCssVariableRanges(value).forEach(([start, end]) => {
      set.add(value.substring(start, end + 1));
    });
  });

  return set;
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
 * Identifies start and end indices of any css variable expressions in the given
 * string.
 *
 * e.g.
 * getCssVariableRanges('var(--aaa-aa) var(--bbb-bb)')
 * yields:
 * [
 *   [0, 12],
 *   [14, 26],
 * ]
 *
 * In cases where there are nested expressions, only the indices of the outermost
 * expression will be included.
 *
 * e.g.
 * getCssVariableRanges('var(--ccc-cc, var(--aaa-aa, green)) var(--bbb-bb)')
 * yields:
 * [
 *   [0, 34], // range for --ccc-cc expression
 *   [36, 48], // range for --bbb-bb expression
 * ]
 * @param value The string to search for css variable expressions
 * @returns An array of [start, end] index pairs for each css variable expression
 */
export function getCssVariableRanges(value: string): [number, number][] {
  const ranges: [number, number][] = [];

  const cssVarPrefix = 'var(--';
  let start = value.indexOf(cssVarPrefix);
  let parenLevel = 0;

  while (start > -1) {
    parenLevel = 1;
    let i = start + cssVarPrefix.length;
    for (; i < value.length; i += 1) {
      if (value[i] === '(') {
        parenLevel += 1;
      } else if (value[i] === ')') {
        parenLevel -= 1;
      }

      if (parenLevel === 0) {
        ranges.push([start, i]);
        break;
      }
    }

    if (parenLevel !== 0) {
      log.error('Unbalanced parentheses in css var expression', value);
      return [];
    }

    start = value.indexOf(cssVarPrefix, i + 1);
  }

  return ranges;
}

/**
 * Make a copy of the given object replacing any css variable expressions
 * contained in its prop values with values resolved from the given HTML element.
 *
 * Note that the browser will force a reflow when calling `getComputedStyle` if
 * css properties have changed. In order to avoid a reflow for every property
 * check we batch setting, getting, and deleting operations:
 * 1. Setting - Create a tmp element and set all css props we want to evaluate
 * 2. Getting - Evaluate all css props via `getPropertyValue` calls
 * 3. Deleting - Remove the tmp element
 * @param record An object whose values may contain css var expressions
 * @param targetElement The element to resolve css variables against. Defaults
 * to document.body
 */
export function resolveCssVariablesInRecord<T extends Record<string, string>>(
  record: T,
  targetElement: HTMLElement = document.body
): T {
  const perfStart = performance.now();

  // Add a temporary div to attach temp css variables to
  const tmpPropEl = document.createElement('div');
  targetElement.appendChild(tmpPropEl);

  const varExpressions = [...extractDistinctCssVariableExpressions(record)];

  // Set temporary css variables for resolving var expressions
  varExpressions.forEach((varExpression, i) => {
    const tmpPropKey = `--${TMP_CSS_PROP_PREFIX}-${i}`;
    tmpPropEl.style.setProperty(tmpPropKey, varExpression);
  });

  const result = {} as T;

  const computedStyle = window.getComputedStyle(tmpPropEl);

  const resolver = (varExpression: string): string => {
    const tmpPropKey = `--${TMP_CSS_PROP_PREFIX}-${varExpressions.indexOf(
      varExpression
    )}`;

    const resolved = computedStyle.getPropertyValue(tmpPropKey);

    return ColorUtils.normalizeCssColor(resolved);
  };

  // Resolve the temporary css variables
  Object.entries(record).forEach(([key, value]) => {
    result[key as keyof T] = resolveCssVariablesInString(
      resolver,
      value
    ) as T[keyof T];
  });

  // Remove the temporary css variables
  tmpPropEl.remove();

  log.debug('Resolved css variables', performance.now() - perfStart, 'ms');

  return result;
}

/**
 * Resolve css variable expressions in the given string using the
 * given resolver and replace the original expressions with the resolved values.
 *
 * @param resolver Function that can resolve a css variable expression
 * @param value Value that may contain css variable expressions
 */
export function resolveCssVariablesInString(
  resolver: VarExpressionResolver,
  value: string
): string {
  const result: string[] = [];
  let i = 0;
  getCssVariableRanges(value).forEach(([start, end]) => {
    if (i < start) {
      result.push(value.substring(i, start));
      i += start - i;
    }

    result.push(resolver(value.substring(start, end + 1)));

    i += end - start + 1;
  });

  if (result.length === 0) {
    return value;
  }

  return result.join('');
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
