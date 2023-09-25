import darkTheme from '../../scss/theme_default_dark.scss?inline';
import lightTheme from '../../scss/theme_default_light.scss?inline';
import { ThemeCache } from './ThemeCache';

/**
 * Derive unique theme key from plugin root path and theme name.
 * @param pluginRootPath The root path of the plugin
 * @param themeName The name of the theme
 */
export function getThemeKey(pluginRootPath: string, themeName: string): string {
  return `${pluginRootPath}_${themeName.toLowerCase().replace(/\s/g, '-')}`;
}

// eslint-disable-next-line import/prefer-default-export
export function preloadTheme(themeCache: ThemeCache): void {
  const preloadData = themeCache.getPreloadData();

  if (preloadData?.preloadStyleContent == null) {
    return;
  }

  const style = document.createElement('style');
  style.innerHTML = preloadData.preloadStyleContent;
  document.head.appendChild(style);

  themeCache.registerBaseThemes([
    {
      name: 'Default Dark',
      themeKey: 'default-dark',
      styleContent: darkTheme,
    },
    {
      name: 'Default Light',
      themeKey: 'default-light',
      styleContent: lightTheme,
    },
  ]);
}

// export function getSelectedThemes({
//   getBaseTheme,
//   getCustomTheme,
//   getPreloadData,
// }: ThemeCache): ThemeData[] {
//   const { baseThemeKey, themeKey } = getPreloadData() ?? {};

//   const base =
//     getBaseTheme(baseThemeKey ?? themeKey) ?? getBaseTheme('default-dark');
//   const custom = getCustomTheme(themeKey);

//   return [base, custom].filter((t): t is ThemeData => t != null);
// }

// export function setSelectedThemes(
//   { getBaseTheme, getCustomTheme, setPreloadData }: ThemeCache,
//   selectedThemeKey: string
// ): void {
//   console.log('[TESTING] setSelectedThemes', selectedThemeKey);

//   const theme =
//     getBaseTheme(selectedThemeKey) ?? getCustomTheme(selectedThemeKey);

//   if (theme == null) {
//     // TODO: maybe clear cache?
//     return;
//   }

//   const { baseThemeKey, themeKey } = theme;

//   const preloadStyleContent = calculatePreloadStyleContent();

//   setPreloadData({
//     baseThemeKey,
//     themeKey,
//     preloadStyleContent,
//   });
// }

// export type ThemeUtilsEventType = 'change';

// export class ThemeUtils {
//   constructor(private cache: ThemeCache) {
//     bindAllMethods(this);
//   }

//   readonly eventListeners: Map<ThemeUtilsEventType, Set<() => void>> =
//     new Map();

//   getSelectedThemes(): ThemeData[] {
//     const { baseThemeKey, themeKey } = this.cache.getPreloadData() ?? {};

//     const base =
//       this.cache.getBaseTheme(baseThemeKey ?? themeKey) ??
//       this.cache.getBaseTheme('default-dark');

//     const custom = this.cache.getCustomTheme(themeKey);

//     return [base, custom].filter((t): t is ThemeData => t != null);
//   }

//   preloadTheme(): void {
//     const preloadData = this.cache.getPreloadData();

//     if (preloadData?.preloadStyleContent == null) {
//       return;
//     }

//     const style = document.createElement('style');
//     style.innerHTML = preloadData.preloadStyleContent;
//     document.head.appendChild(style);

//     this.cache.registerBaseTheme({
//       name: 'Default Dark',
//       themeKey: 'default-dark',
//       styleContent: darkTheme,
//     });

//     this.cache.registerBaseTheme({
//       name: 'Default Light',
//       themeKey: 'default-light',
//       styleContent: lightTheme,
//     });

//     this.eventListeners.get('change')?.forEach(handler => handler());
//   }

//   registerEventListener(
//     eventType: ThemeUtilsEventType,
//     handler: () => void
//   ): () => void {
//     if (!this.eventListeners.has(eventType)) {
//       this.eventListeners.set(eventType, new Set());
//     }

//     this.eventListeners.get(eventType)?.add(handler);

//     return () => {
//       this.eventListeners.get(eventType)?.delete(handler);
//     };
//   }

//   setSelectedThemes(selectedThemeKey: string): void {
//     console.log('[TESTING] setSelectedThemes', selectedThemeKey);

//     const theme =
//       this.cache.getBaseTheme(selectedThemeKey) ??
//       this.cache.getCustomTheme(selectedThemeKey);

//     if (theme == null) {
//       // TODO: maybe clear the cache?
//       return;
//     }

//     const { baseThemeKey, themeKey } = theme;

//     const preloadStyleContent = calculatePreloadStyleContent();

//     this.cache.setPreloadData({
//       baseThemeKey,
//       themeKey,
//       preloadStyleContent,
//     });

//     this.eventListeners.get('change')?.forEach(handler => handler());
//   }
// }
