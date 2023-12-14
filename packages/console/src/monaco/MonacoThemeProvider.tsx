import { ReactNode, useEffect } from 'react';
import { useTheme } from '@deephaven/components';
import MonacoUtils from './MonacoUtils';

export interface MonacoThemeProviderProps {
  children: ReactNode;
}

export function MonacoThemeProvider({
  children,
}: MonacoThemeProviderProps): JSX.Element {
  const { activeThemes } = useTheme();

  useEffect(
    function refreshMonacoTheme() {
      if (activeThemes != null) {
        MonacoUtils.initTheme();
      }
    },
    [activeThemes]
  );

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}
