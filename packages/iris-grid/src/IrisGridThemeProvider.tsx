import { useTheme } from '@deephaven/components';
import { createContext, ReactNode, useMemo } from 'react';
import { createDefaultIrisGridTheme, IrisGridThemeType } from './IrisGridTheme';

/**
 * The context value for the IrisGridThemeProvider.
 * This must be a full object and not a partial so that we
 * can createDefaultIrisGridTheme once, and not per grid.
 */
export type IrisGridThemeContextValue = IrisGridThemeType;

export const IrisGridThemeContext =
  createContext<IrisGridThemeContextValue | null>(null);

export interface IrisGridThemeProviderProps {
  children: ReactNode;
}

export function IrisGridThemeProvider({
  children,
}: IrisGridThemeProviderProps): JSX.Element {
  const { activeThemes } = useTheme();

  const gridTheme = useMemo(createDefaultIrisGridTheme, [activeThemes]);

  return (
    <IrisGridThemeContext.Provider value={gridTheme}>
      {children}
    </IrisGridThemeContext.Provider>
  );
}
