import { useContextOrThrow } from '@deephaven/react-hooks';
import Log from '@deephaven/log';
import { bindAllMethods } from '@deephaven/utils';
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

export class ThemeCache {
  constructor(private readonly localStorageKey: string) {
    bindAllMethods(this);
  }

  readonly baseThemes: Map<string, ThemeData> = new Map();

  readonly customThemes: Map<string, ThemeData> = new Map();

  readonly eventListeners: Map<ThemeCacheEventType, Set<() => void>> =
    new Map();

  appliedThemes: ThemeData[] | null = null;

  onChange(): void {
    log.debug(
      'onChange:',
      '\npreloadData:',
      JSON.stringify(this.preloadData),
      '\nbaseThemes:',
      JSON.stringify([...this.baseThemes.keys()]),
      '\ncustomThemes:',
      JSON.stringify([...this.customThemes.keys()])
    );

    this.appliedThemes = null;
    this.eventListeners.get('change')?.forEach(handler => handler());
  }

  registerEventListener(
    eventType: ThemeCacheEventType,
    handler: () => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    this.eventListeners.get(eventType)?.add(handler);

    return () => {
      this.eventListeners.get(eventType)?.delete(handler);
    };
  }

  private preloadData: ThemePreloadData | null = null;

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

  setPreloadData(data: ThemePreloadData): void {
    const localStorageValue = JSON.stringify(data);

    if (localStorageValue === localStorage.getItem(this.localStorageKey)) {
      return;
    }

    this.preloadData = data;
    localStorage.setItem(this.localStorageKey, localStorageValue);

    this.onChange();
  }

  getSelectedThemes(): ThemeData[] {
    if (this.appliedThemes == null) {
      const { themeKey } = this.getPreloadData() ?? {};

      const custom = this.getCustomTheme(themeKey);

      const base = this.getBaseTheme(
        custom?.baseThemeKey ?? themeKey ?? DEFAULT_DARK_THEME_KEY
      );

      this.appliedThemes = [base, custom].filter(
        (t): t is ThemeData => t != null
      );

      log.debug('appliedThemes:', this.appliedThemes);
    }

    return this.appliedThemes;
  }

  getBaseTheme(themeKey?: string | null): ThemeData | null {
    if (themeKey == null) {
      return null;
    }

    return this.baseThemes.get(themeKey) ?? null;
  }

  getCustomTheme(themeKey?: string | null): ThemeData | null {
    if (themeKey == null) {
      return null;
    }

    return this.customThemes.get(themeKey) ?? null;
  }

  registerBaseThemes(themeDatas: ThemeData[]): void {
    log.debug('registerBaseThemes:', themeDatas);

    themeDatas.forEach(themeData => {
      this.baseThemes.set(themeData.themeKey, themeData);
    });

    this.onChange();
  }

  registerCustomThemes(themeDatas: ThemeData[]): void {
    log.debug('registerCustomThemes:', themeDatas);

    themeDatas.forEach(themeData => {
      this.customThemes.set(themeData.themeKey, themeData);
    });

    this.onChange();
  }

  setSelectedThemes(selectedThemeKey: string): void {
    const theme =
      this.getBaseTheme(selectedThemeKey) ??
      this.getCustomTheme(selectedThemeKey);

    if (theme == null) {
      // TODO: maybe clear cache?
      return;
    }

    const { themeKey } = theme;

    const preloadStyleContent = calculatePreloadStyleContent();

    this.setPreloadData({
      themeKey,
      preloadStyleContent,
    });
  }
}

export default ThemeCache;

export function calculatePreloadStyleContent(): ThemePreloadStyleContent {
  const pairs = ['--dh-accent-color', '--dh-background-color'].map(
    key => `${key}:${getComputedStyle(document.body).getPropertyValue(key)}`
  );

  return `:root{${pairs.join(';')}}`;
}

export const ThemeCacheContext = createContext<ThemeCache | null>(null);

export function useThemeCache(): ThemeCache {
  return useContextOrThrow(
    ThemeCacheContext,
    'No ThemeCacheContext value found. Component must be wrapped in a ThemeCacheContext.Provider'
  );
}
