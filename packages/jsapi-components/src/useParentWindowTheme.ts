import { useEffect, useRef, useState } from 'react';
import {
  PARENT_THEME_KEY,
  THEME_KEY_OVERRIDE_QUERY_PARAM,
  type ThemeData,
} from '@deephaven/components';

export interface UseParentWindowThemeResult {
  isPending: boolean;
  themeData?: ThemeData;
}

export function useParentWindowTheme(): UseParentWindowThemeResult {
  const [result, setResult] = useState<UseParentWindowThemeResult>(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      isPending:
        searchParams.get(THEME_KEY_OVERRIDE_QUERY_PARAM) === PARENT_THEME_KEY,
    };
  });

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
