import { useTheme } from '@deephaven/components';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { createDefaultIrisGridTheme, IrisGridThemeType } from './IrisGridTheme';

export type IrisGridThemeContextValue = Partial<IrisGridThemeType>;

export const IrisGridThemeContext =
  createContext<IrisGridThemeContextValue | null>(null);

export interface IrisGridThemeProviderProps {
  children: ReactNode;
}

export function IrisGridThemeProvider({
  children,
}: IrisGridThemeProviderProps): JSX.Element {
  const { activeThemes } = useTheme();

  const [gridTheme, setGridTheme] = useState<IrisGridThemeContextValue>({});

  useEffect(
    function refreshIrisGridTheme() {
      if (activeThemes != null) {
        setGridTheme(createDefaultIrisGridTheme());
      }
    },
    [activeThemes]
  );

  return (
    <IrisGridThemeContext.Provider value={gridTheme}>
      {children}
    </IrisGridThemeContext.Provider>
  );
}
