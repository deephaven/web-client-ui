import { GlobalThemeCache } from './ThemeCache';

// eslint-disable-next-line import/prefer-default-export
export function initializeTheme(): void {
  const preloadData = GlobalThemeCache.getPreloadData();

  if (preloadData?.variables == null) {
    return;
  }

  Object.entries(preloadData.variables).forEach(([key, value]) => {
    document.body.style.setProperty(key, value);
  });
}
