import Log from '@deephaven/log';
import { assertNotNull } from '@deephaven/utils';
import darkTheme from '../../scss/theme_default_dark.scss?inline';
import lightTheme from '../../scss/theme_default_light.scss?inline';
import {
  DEFAULT_DARK_THEME_KEY,
  DEFAULT_LIGHT_THEME_KEY,
  DEFAULT_PRELOAD_DATA_VARIABLES,
  ThemeData,
  ThemePreloadData,
  ThemePreloadStyleContent,
  ThemeRegistrationData,
  ThemeRegistrationStorageData,
  THEME_CACHE_LOCAL_STORAGE_KEY,
} from './ThemeModel';

const log = Log.module('ThemeUtils');

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
  themeRegistration: ThemeRegistrationStorageData
): [ThemeData] | [ThemeData, ThemeData] {
  const custom = themeRegistration.custom.get(themeKey);

  const baseThemeKey = custom?.baseThemeKey ?? themeKey;

  let base = themeRegistration.base.get(baseThemeKey);

  if (base == null) {
    log.error(
      `No registered base theme found for theme key: '${baseThemeKey}'`
    );
    base = themeRegistration.base.get(DEFAULT_DARK_THEME_KEY);

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
      styleContent: darkTheme,
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
 * Map theme registration data to storage data.
 * @param themeRegistrationData
 */
export function mapThemeRegistrationData(
  themeRegistrationData: ThemeRegistrationData
): ThemeRegistrationStorageData {
  const { base, custom } = themeRegistrationData;

  return {
    base: new Map(base.map(theme => [theme.themeKey, theme])),
    custom: new Map(custom.map(theme => [theme.themeKey, theme])),
  };
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
 * @param pluginRootPath The root path of the plugin
 * @param themeName The name of the theme
 */
export function getThemeKey(pluginRootPath: string, themeName: string): string {
  return `${pluginRootPath}_${themeName}`
    .toLowerCase()
    .replace(/\W/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Preload minimal theme variables from the cache.
 * @param themeCache The theme cache to preload from
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
