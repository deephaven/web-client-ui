import { useEffect, useRef, useState } from 'react';
import { requestParentResponse } from '@deephaven/utils';
import {
  PARENT_THEME_KEY,
  PARENT_THEME_REQUEST,
  type ThemeData,
} from './ThemeModel';
import { hasParentThemeKey } from './ThemeUtils';

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

    requestParentResponse(PARENT_THEME_REQUEST);

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
