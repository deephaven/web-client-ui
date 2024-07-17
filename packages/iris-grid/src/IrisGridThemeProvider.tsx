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
  /* The density of the grid. Defaults to regular */
  density?: 'compact' | 'regular' | 'spacious';
}

export function IrisGridThemeProvider({
  children,
  density,
}: IrisGridThemeProviderProps): JSX.Element {
  const { activeThemes } = useTheme();

  const gridTheme = useMemo(
    () => createDefaultIrisGridTheme(density),
    // When the theme changes, we need to update the grid theme which reads CSS variables to JS
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeThemes, density]
  );

  return (
    <IrisGridThemeContext.Provider value={gridTheme}>
      {children}
    </IrisGridThemeContext.Provider>
  );
}
