import { useEffect, useRef, useState } from 'react';
import Log from '@deephaven/log';
import { type ThemeData } from './ThemeModel';
import {
  hasParentThemeKey,
  parseParentThemeData,
  requestParentThemeData,
} from './ThemeUtils';

const logger = Log.module('useParentWindowTheme');
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

    requestParentThemeData()
      .then(parseParentThemeData)
      .then(themeData =>
        setResult({
          isPending: false,
          themeData,
        })
      )
      .catch(err => {
        logger.error(err);
        setResult({ isPending: false });
      });
  }, []);

  return result;
}

export default useParentWindowTheme;
