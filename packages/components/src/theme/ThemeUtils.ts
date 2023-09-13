export type ThemeVariables = Record<string, string | boolean | number | null>;

export const THEME_LOCAL_STORAGE_KEY = 'deephaven.themeKey';
const CSS_PROPERTY_NAME_REGEX = /var\((--.+?)\)/g;
const THEME_KEY_REGEX = /^(custom|default)/;
const THEME_CSS_CLASS_NAME_REGEX = /dh-theme-(custom|default)-[^ ]+/g;

/**
 * Get css class name for theme key.
 * @param themeKey Theme key
 */
export function getThemeClassName(themeKey: string): string {
  return `dh-theme-${themeKey}`;
}

/**
 * Initialize theme from any previously selected theme key.
 */
export function initializeTheme(): void {
  selectTheme(localStorage.getItem(THEME_LOCAL_STORAGE_KEY) ?? '');
}

/**
 * Set the currently selected theme. This will store the given theme key in
 * localStorage and update css classes on the body element for the selected
 * theme. The body will have at least a `dh-theme-default-xxx` class and may
 * have a `dh-custom-
 * @param themeKey
 */
export function selectTheme(themeKey: string): void {
  if (themeKey !== '' && THEME_KEY_REGEX.test(themeKey) === false) {
    throw new Error(`Invalid theme key: ${themeKey}`);
  }

  if (themeKey === '') {
    localStorage.removeItem(THEME_LOCAL_STORAGE_KEY);
  } else {
    localStorage.setItem(THEME_LOCAL_STORAGE_KEY, themeKey);
  }

  // Clear existing theme classes
  document.body.className = document.body.className.replace(
    THEME_CSS_CLASS_NAME_REGEX,
    ''
  );

  if (themeKey === '') {
    document.body.classList.add(getThemeClassName('default-dark'));
    return;
  }

  // May be default or custom theme
  document.body.classList.add(getThemeClassName(themeKey));

  // By default, custom themes are based on the `deafult-dark` theme, but they
  // can optionally specify a different base theme via the `--dh-base-theme`
  // css variable.
  if (themeKey?.startsWith('custom-') === true) {
    const baseThemeKey =
      getComputedStyle(document.body).getPropertyValue('--dh-base-theme') ||
      'default-dark';

    document.body.classList.add(getThemeClassName(baseThemeKey));
  }
}

/**
 * Replace custom CSS property values in an object with computed values.
 * @param targetElement Element to use to compute CSS property values
 * @param variables Theme variables object to replace values in
 */
export function replaceCssVariables(
  targetElement: HTMLElement | null,
  variables: ThemeVariables
): ThemeVariables {
  return Object.entries(variables).reduce((result, [key, value]) => {
    // eslint-disable-next-line no-param-reassign
    result[key] =
      typeof value === 'string'
        ? value.replace(CSS_PROPERTY_NAME_REGEX, (_match, propertyName) =>
            getComputedStyle(targetElement ?? document.body).getPropertyValue(
              propertyName
            )
          )
        : value;

    return result;
  }, {} as ThemeVariables);
}
