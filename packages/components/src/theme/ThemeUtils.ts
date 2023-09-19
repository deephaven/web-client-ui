import Log from '@deephaven/log';
import darkTheme from '../../scss/theme_default_dark.scss?inline';
import lightTheme from '../../scss/theme_default_light.scss?inline';
import { ThemeCache } from './ThemeCache';
import {
  DEFAULT_DARK_THEME_KEY,
  DEFAULT_LIGHT_THEME_KEY,
  DEFAULT_PRELOAD_DATA_VARIABLES,
  ThemePreloadStyleContent,
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
export function preloadTheme(themeCache: ThemeCache): void {
  const preloadStyleContent =
    themeCache.getPreloadData()?.preloadStyleContent ??
    calculatePreloadStyleContent();

  log.debug('Preloading theme content:', `'${preloadStyleContent}'`);

  const style = document.createElement('style');
  style.innerHTML = preloadStyleContent;
  document.head.appendChild(style);
}

/**
 * Register the default base themes with the theme cache.
 * @param themeCache The theme cache to register the themes with
 */
export function registerBaseThemes(themeCache: ThemeCache): void {
  themeCache.registerBaseThemes([
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
  ]);
}
