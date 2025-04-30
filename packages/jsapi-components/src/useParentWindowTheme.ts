import { useEffect, useRef, useState } from 'react';
import {
  hasParentThemeKey,
  PARENT_THEME_KEY,
  type ThemeData,
} from '@deephaven/components';

export interface UseParentWindowThemeResult {
  isPending: boolean;
  themeData?: ThemeData;
}

/**
 * If parent theme is configured via `theme=PARENT_THEME_KEY` query param, handle
 * `postMessage` communication to retrieve the theme data from the parent window.
 */
export function useParentWindowTheme(): UseParentWindowThemeResult {
  const [result, setResult] = useState<UseParentWindowThemeResult>(() => ({
    isPending: hasParentThemeKey(),
  }));

  const isEnabledRef = useRef(result.isPending);

  useEffect(() => {
    if (!isEnabledRef.current) {
      return;
    }

    setTimeout(() => {
      // TODO: convert theme vars to ThemeData and validate

      setResult({
        isPending: false,
        themeData: {
          baseThemeKey: 'default-dark',
          themeKey: PARENT_THEME_KEY,
          name: 'Parent Theme',
          styleContent: ':root{--dh-color-bg:red;}',
        },
      });
    }, 1000);
  }, []);

  return result;
}

export default useParentWindowTheme;
