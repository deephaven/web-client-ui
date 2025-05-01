import { useEffect, useState } from 'react';
import Log from '@deephaven/log';
import { type ThemeData } from './ThemeModel';
import {
  isParentThemeEnabled,
  parseParentThemeData,
  requestParentThemeData,
} from './ThemeUtils';

const logger = Log.module('useParentWindowTheme');
export interface UseParentWindowThemeResult {
  isEnabled: boolean;
  isPending: boolean;
  themeData?: ThemeData;
}

/**
 * If parent theme is configured via `theme=PARENT_THEME_KEY` query param, handle
 * `postMessage` communication to retrieve the theme data from the parent window.
 */
export function useParentWindowTheme(): UseParentWindowThemeResult {
  const [result, setResult] = useState<UseParentWindowThemeResult>(() => {
    const isEnabled = isParentThemeEnabled();
    return {
      isEnabled,
      isPending: isEnabled,
    };
  });

  useEffect(() => {
    if (!result.isEnabled) {
      return;
    }

    logger.debug('Requesting parent theme data');

    requestParentThemeData()
      .then(parseParentThemeData)
      .then(themeData =>
        setResult({
          isEnabled: true,
          isPending: false,
          themeData,
        })
      )
      .catch(err => {
        logger.error(err);
        setResult({ isEnabled: true, isPending: false });
      });
  }, [result.isEnabled]);

  return result;
}

export default useParentWindowTheme;
