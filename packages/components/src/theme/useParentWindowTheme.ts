import { useEffect, useState } from 'react';
import Log from '@deephaven/log';
import { getWindowParent, type PostMessage } from '@deephaven/utils';
import {
  MSG_REQUEST_SET_THEME,
  type ParentThemeData,
  type ThemeData,
} from './ThemeModel';
import {
  isParentThemeData,
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

    /** Parse parent theme data and update the result */
    function handleParentThemeData(parentThemeData: ParentThemeData) {
      const themeData = parseParentThemeData(parentThemeData);

      setResult({
        isEnabled: true,
        isPending: false,
        themeData,
      });
    }

    /** Parent window can explicitly set the theme */
    function onMessage(event: MessageEvent<PostMessage<unknown>>): void {
      const parent = getWindowParent();
      if (parent == null || event.source !== parent) {
        return;
      }

      if (event.data.message === MSG_REQUEST_SET_THEME) {
        if (isParentThemeData(event.data.payload)) {
          handleParentThemeData(event.data.payload);
        }
      }
    }

    window.addEventListener('message', onMessage);

    /** Request initial theme data from parent window */
    requestParentThemeData()
      .then(handleParentThemeData)
      .catch(err => {
        logger.error(err);
        setResult({ isEnabled: true, isPending: false });
      });

    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, [result.isEnabled]);

  return result;
}

export default useParentWindowTheme;
