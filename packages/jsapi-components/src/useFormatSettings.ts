import React from 'react';
import { Settings } from '@deephaven/jsapi-utils';
import { useContextOrThrow } from '@deephaven/react-hooks';

export const FormatSettingsContext = React.createContext<Settings | null>(null);

export function useFormatSettings(): Settings {
  return useContextOrThrow(
    FormatSettingsContext,
    'No format settings available in useFormatSettings. Was code wrapped in FormatSettingsContext.Provider?'
  );
}

export default useFormatSettings;
