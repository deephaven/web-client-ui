const THEME_CACHE_LOCAL_STORAGE_KEY = 'deephaven.themeCache';

export interface ThemePreloadData {
  themeKey: string;
  variables: Record<string, string>;
}

export class ThemeCache {
  constructor(private localStorageKey: string) {}

  getPreloadData(): ThemePreloadData | null {
    const data = localStorage.getItem(this.localStorageKey);

    if (data == null) {
      return null;
    }

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  setPreloadData(data: ThemePreloadData): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(data));
  }
}

export default ThemeCache;

export const GlobalThemeCache = new ThemeCache(THEME_CACHE_LOCAL_STORAGE_KEY);
