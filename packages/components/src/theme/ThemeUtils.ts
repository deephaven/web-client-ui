import Log from '@deephaven/log';
import { assertNotNull, ColorUtils } from '@deephaven/utils';
import { themeDark } from './theme-dark';
import {
  DEFAULT_DARK_THEME_KEY,
  DEFAULT_PRELOAD_DATA_VARIABLES,
  ThemeData,
  ThemePreloadData,
  CssVariableStyleContent,
  ThemePreloadColorVariable,
  ThemeRegistrationData,
  THEME_CACHE_LOCAL_STORAGE_KEY,
  SVG_ICON_MANUAL_COLOR_MAP,
  ThemeCssVariableName,
  ThemeIconsRequiringManualColorChanges,
} from './ThemeModel';

const log = Log.module('ThemeUtils');

export const CSS_VAR_EXPRESSION_PREFIX = 'var(--';
export const TMP_CSS_PROP_PREFIX = 'dh-tmp';
export const NON_WHITESPACE_REGEX = /\S/;
export const WHITESPACE_REGEX = /\s/;

export type VarExpressionResolver = (varExpression: string) => string;

/**
 * Resolves the current values of CSS variables we want to preload. Preloading
 * happens before themes are fully loaded so that we can style things like the
 * loading spinner and background color which are shown to the user early on in
 * the app lifecycle.
 */
export function calculatePreloadStyleContent(): CssVariableStyleContent {
  const resolveVar = createCssVariableResolver(document.body);

  // Calculate the current preload variables. If the variable is not set, use
  // the default value.
  const pairs = Object.keys(DEFAULT_PRELOAD_DATA_VARIABLES).map(
    key => `${key}:${resolveVar(key as ThemePreloadColorVariable)}`
  );

  return `:root{${pairs.join(';')}}`;
}

/**
 * Create a resolver function for calculating the value of a css variable based
 * on a given element's computed style. If the variable resolves to '', we check
 * DEFAULT_PRELOAD_DATA_VARIABLES for a default value, and if one does not exist,
 * return ''.
 * @param el Element to resolve css variables against
 */
export function createCssVariableResolver(
  el: Element
): (varName: ThemeCssVariableName) => string {
  const computedStyle = getComputedStyle(el);

  /**
   * Resolve the given css variable name to a value. If the variable is not set,
   * return the default preload value or '' if one does not exist.
   */
  return function cssVariableResolver(varName: ThemeCssVariableName): string {
    const value = computedStyle.getPropertyValue(varName);

    if (value !== '') {
      return value;
    }

    return (
      DEFAULT_PRELOAD_DATA_VARIABLES[varName as ThemePreloadColorVariable] ?? ''
    );
  };
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
    getExpressionRanges(value).forEach(([start, end]) => {
      const expression = value.substring(start, end + 1);

      if (expression.includes(CSS_VAR_EXPRESSION_PREFIX)) {
        set.add(expression);
      }
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
      styleContent: themeDark,
    },
    // The ThemePicker shows whenever more than 1 theme is available. Disable
    // light theme for now to keep the picker hidden until it is fully
    // implemented by #1539.
    // {
    //   name: 'Default Light',
    //   themeKey: DEFAULT_LIGHT_THEME_KEY,
    //   styleContent: themeLight,
    // },
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
 * Identifies start and end indices of any top-level expressions in the given
 * string.
 *
 * e.g.
 * getExpressionRanges('var(--aaa-aa) #fff var(--bbb-bb)')
 * yields:
 * [
 *   [0, 12],  // 'var(--aaa-aa)'
 *   [14, 17]  // '#fff'
 *   [19, 31], // 'var(--bbb-bb)'
 * ]
 *
 * In cases where there are nested expressions, only the indices of the outermost
 * expression will be included.
 *
 * e.g.
 * getExpressionRanges('var(--ccc-cc, var(--aaa-aa, green)) var(--bbb-bb)')
 * yields:
 * [
 *   [0, 34],  // 'var(--ccc-cc, var(--aaa-aa, green))'
 *   [36, 48], // 'var(--bbb-bb)'
 * ]
 * @param value The string to search for expressions
 * @returns An array of [start, end] index pairs for each expression
 */
export function getExpressionRanges(value: string): [number, number][] {
  const ranges: [number, number][] = [];

  let start = NON_WHITESPACE_REGEX.exec(value)?.index ?? 0;
  let parenLevel = 0;

  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '(') {
      parenLevel += 1;
    } else if (value[i] === ')') {
      parenLevel -= 1;
    }

    if (
      i === value.length - 1 ||
      (WHITESPACE_REGEX.test(value[i + 1]) && parenLevel === 0)
    ) {
      ranges.push([start, i]);

      while (i < value.length - 1 && WHITESPACE_REGEX.test(value[i + 1])) {
        i += 1;
      }

      start = i + 1;
    }
  }

  if (parenLevel !== 0) {
    log.error('Unbalanced parentheses in css var expression', value);
    return [];
  }

  return ranges;
}

/**
 * Replace the `fill='...'` attribute in the given SVG content with the given
 * color string.
 * @param svgContent Inline SVG content to replace the fill color in
 * @param fillColor The color to replace the fill color with
 */
export function replaceSVGFillColor(
  svgContent: string,
  fillColor: string
): string {
  return svgContent.replace(
    /fill='.*?'/,
    `fill='${encodeURIComponent(fillColor)}'`
  );
}

/**
 * Make a copy of the given object replacing any css variable expressions
 * contained in its prop values with values resolved from the given HTML element.
 * Variables that resolve to color strings will also be normalized to rgb or
 * rgba color strings.
 *
 * Note that the browser will force a reflow when calling `getComputedStyle` if
 * css properties have changed. In order to avoid a reflow for every property
 * check we use distinct setup, resolve / normalize, and cleanup passes:
 * 1. Setup - Create a tmp element and set all css props we want to evaluate
 * 2. Resolve / Normalize - Evaluate all css props via `getPropertyValue` calls
 *    and replace the original expressions with resolved values. Also normalize
 *    css colors to rgb/a.
 * 3. Cleanup - Remove the tmp element
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
  getExpressionRanges(value).forEach(([start, end]) => {
    if (i < start) {
      result.push(value.substring(i, start));
      i += start - i;
    }

    const expression = value.substring(start, end + 1);

    result.push(
      expression.includes(CSS_VAR_EXPRESSION_PREFIX)
        ? resolver(expression)
        : expression
    );

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
  style.id = 'theme-preload';
  style.innerHTML = preloadStyleContent;
  document.head.appendChild(style);
}

/**
 * Inline SVGs cannot depend on dynamic CSS variables, so we have to statically
 * update them if we want to change their color.
 *
 * This function:
 * 1. Clears any previous overrides
 * 2. Resolves CSS variables containing inline SVG urls
 * 3. Resolves mapped color variables and replaces the `fill='...'` attribute with the result
 * 4. Sets the original CSS variable to the new replaced value
 *
 * Note that it is preferable to use inline SVGs as background-mask values and
 * just change the background color instead of relying on this util, but this
 * is not always possible. e.g. <select> elements don't support pseudo elements,
 * so there's not a good way to set icons via masks.
 */
export function overrideSVGFillColors(): void {
  const resolveVar = createCssVariableResolver(document.body);

  Object.entries(SVG_ICON_MANUAL_COLOR_MAP).forEach(([key, value]) => {
    // Clear any previous override so that our variables get resolved against the
    // actual svg content provided by the active themes and not from a previous
    // override
    document.body.style.removeProperty(key);

    const svgContent = resolveVar(key as ThemeIconsRequiringManualColorChanges);
    const fillColor = resolveVar(value as ThemePreloadColorVariable);

    const newSVGContent = replaceSVGFillColor(svgContent, fillColor);

    // This will take precedence over any values for the variable provided by
    // the active themes
    document.body.style.setProperty(key, newSVGContent);
  });
}
