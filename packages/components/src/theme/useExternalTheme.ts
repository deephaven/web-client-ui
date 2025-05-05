import { useEffect, useState } from 'react';
import Log from '@deephaven/log';
import { getWindowParent, type PostMessage } from '@deephaven/utils';
import {
  MSG_REQUEST_SET_THEME,
  type ExternalThemeData,
  type ThemeData,
} from './ThemeModel';
import {
  isExternalThemeData,
  isExternalThemeEnabled,
  parseExternalThemeData,
  requestExternalThemeData,
} from './ThemeUtils';

const logger = Log.module('useExternalTheme');
export interface UseExternalThemeResult {
  isEnabled: boolean;
  isPending: boolean;
  themeData?: ThemeData;
}

/**
 * If external theme is configured via `theme=EXTERNAL_THEME_KEY` query param,
 * handle `postMessage` communication to retrieve the theme data from the parent
 * Window. The hook will also listen for `MSG_REQUEST_SET_THEME` messages from
 * the parent and current Window to allow explicitly setting the theme.
 */
export function useExternalTheme(): UseExternalThemeResult {
  const [result, setResult] = useState<UseExternalThemeResult>(() => {
    const isEnabled = isExternalThemeEnabled();
    return {
      isEnabled,
      isPending: isEnabled,
    };
  });

  useEffect(() => {
    if (!result.isEnabled) {
      return;
    }

    logger.debug('Requesting external theme data');

    /** Parse external theme data and update the result */
    function handleExternalThemeData(externalThemeData: ExternalThemeData) {
      const themeData = parseExternalThemeData(externalThemeData);

      setResult({
        isEnabled: true,
        isPending: false,
        themeData,
      });
    }

    /** Parent or current Window can explicitly set the theme */
    function onMessage(event: MessageEvent<PostMessage<unknown>>): void {
      const parent = getWindowParent();

      // Allow messages from parent or current window
      if (event.source !== window && event.source !== parent) {
        return;
      }

      if (event.data.message === MSG_REQUEST_SET_THEME) {
        if (isExternalThemeData(event.data.payload)) {
          handleExternalThemeData(event.data.payload);
        }
      }
    }

    window.addEventListener('message', onMessage);

    /** Request initial theme data from parent window */
    requestExternalThemeData()
      .then(handleExternalThemeData)
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

export default useExternalTheme;
