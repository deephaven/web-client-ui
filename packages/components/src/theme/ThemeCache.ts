import { useContextOrThrow } from '@deephaven/react-hooks';
import Log from '@deephaven/log';
import { assertNotNull, bindAllMethods } from '@deephaven/utils';
import { createContext } from 'react';
import {
  DEFAULT_DARK_THEME_KEY,
  ThemeData,
  ThemePreloadData,
  ThemePreloadStyleContent,
} from './ThemeModel';

const log = Log.module('ThemeCache');

export const THEME_CACHE_LOCAL_STORAGE_KEY = 'deephaven.themeCache';

export type ThemeCacheEventType = 'change';

/**
 * Creates a string containing preload style content for the current theme.
 * This resolves the current values of a few CSS variables that can be used
 * to style the page before the theme is loaded on next page load.
 */
export function calculatePreloadStyleContent(): ThemePreloadStyleContent {
  const pairs = ['--dh-accent-color', '--dh-background-color'].map(
    key => `${key}:${getComputedStyle(document.body).getPropertyValue(key)}`
  );

  return `:root{${pairs.join(';')}}`;
}

/**
 * Cache containing registered themes.
 */
export class ThemeCache {
  constructor(private readonly localStorageKey: string) {
    bindAllMethods(this);
  }

  readonly baseThemes: Map<string, ThemeData> = new Map();

  readonly customThemes: Map<string, ThemeData> = new Map();

  readonly eventListeners: Map<ThemeCacheEventType, Set<() => void>> =
    new Map();

  appliedThemes: [ThemeData] | [ThemeData, ThemeData] | null = null;

  /**
   * Clear appliedThemes cache and emit a `change` event to any listeners.
   */
  onChange(): void {
    log.debug(
      'onChange:',
      '\npreloadData:',
      `themeKey: '${this.preloadData?.themeKey}', preloadStyleContent: '${this.preloadData?.preloadStyleContent}'`,
      '\nbaseThemes:',
      [...this.baseThemes.keys()].join(', '),
      '\ncustomThemes:',
      [...this.customThemes.keys()].join(', ')
    );

    this.appliedThemes = null;
    this.eventListeners.get('change')?.forEach(handler => handler());
  }

  /**
   * Register an event listener for the given event type.
   * @param eventType The event type to listen for
   * @param handler The handler to call when the event is emitted
   * @returns A function to unregister the event listener
   */
  registerEventListener(
    eventType: ThemeCacheEventType,
    handler: () => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    this.eventListeners.get(eventType)?.add(handler);

    /** Deregister the event handler. */
    return () => {
      this.eventListeners.get(eventType)?.delete(handler);
    };
  }

  private preloadData: ThemePreloadData | null = null;

  /**
   * Get the preload data from local storage or null if it does not exist or is
   * invalid
   */
  getPreloadData(): Partial<ThemePreloadData> | null {
    if (this.preloadData == null) {
      const data = localStorage.getItem(this.localStorageKey);

      if (data == null) {
        return null;
      }

      try {
        this.preloadData = JSON.parse(data);
      } catch {
        // ignore
      }
    }

    return this.preloadData;
  }

  /**
   * Checks if given data matches the current preload data. If it does, do nothing.
   * If the data has changed, update the preload data and emit a `change` event.
   * @param data
   */
  setPreloadData(themeKey: string): void {
    const newData = {
      themeKey,
      preloadStyleContent: calculatePreloadStyleContent(),
    };

    const newLocalStorageValue = JSON.stringify(newData);

    if (newLocalStorageValue === localStorage.getItem(this.localStorageKey)) {
      return;
    }

    this.preloadData = newData;
    localStorage.setItem(this.localStorageKey, newLocalStorageValue);

    this.onChange();
  }

  /**
   * Returns an array of the selected themes. The first item will always be one
   * of the base themes. Optionally, the second item will be a custom theme.
   */
  getSelectedThemes(): [ThemeData] | [ThemeData, ThemeData] {
    if (this.appliedThemes == null) {
      const { themeKey } = this.getPreloadData() ?? {};

      const custom = this.getCustomTheme(themeKey);

      const base = this.getBaseTheme(
        custom?.baseThemeKey ?? themeKey ?? DEFAULT_DARK_THEME_KEY
      );

      assertNotNull(base);

      log.debug('Caching appliedThemes:', base.themeKey, custom?.themeKey);

      this.appliedThemes = custom == null ? [base] : [base, custom];
    }

    return this.appliedThemes;
  }

  /**
   * Get the base theme with the given key or null if it does not exist.
   * @param themeKey The theme key to get
   */
  getBaseTheme(themeKey?: string | null): ThemeData | null {
    if (themeKey == null) {
      return null;
    }

    return this.baseThemes.get(themeKey) ?? null;
  }

  /**
   * Get the custom theme with the given key or null if it does not exist.
   * @param themeKey The theme key to get
   */
  getCustomTheme(themeKey?: string | null): ThemeData | null {
    if (themeKey == null) {
      return null;
    }

    return this.customThemes.get(themeKey) ?? null;
  }

  /**
   * Register the given base themes with the cache.
   * @param themeDatas The base themes to register
   */
  registerBaseThemes(themeDatas: ThemeData[]): void {
    log.debug('registerBaseThemes:', themeDatas);

    themeDatas.forEach(themeData => {
      this.baseThemes.set(themeData.themeKey, themeData);
    });

    this.onChange();
  }

  /**
   * Register the given custom themes with the cache.
   * @param themeDatas The custom themes to register
   */
  registerCustomThemes(themeDatas: ThemeData[]): void {
    log.debug('registerCustomThemes:', themeDatas);

    themeDatas.forEach(themeData => {
      this.customThemes.set(themeData.themeKey, themeData);
    });

    this.onChange();
  }

  /**
   * Select the theme with the given key.
   * @param themeKey The theme key to select
   */
  setSelectedTheme(themeKey: string): void {
    this.setPreloadData(themeKey);
  }
}

export default ThemeCache;

export const ThemeCacheContext = createContext<ThemeCache | null>(null);

/**
 * Get the theme cache from the context.
 */
export function useThemeCache(): ThemeCache {
  return useContextOrThrow(
    ThemeCacheContext,
    'No ThemeCacheContext value found. Component must be wrapped in a ThemeCacheContext.Provider'
  );
}
