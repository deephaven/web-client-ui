import { useTheme } from '@deephaven/components';
import { createContext, type ReactNode, useMemo } from 'react';
import {
  createDefaultIrisGridTheme,
  type IrisGridThemeType,
} from './IrisGridTheme';

/**
 * The context value for the IrisGridThemeProvider.
 * This must be a full object and not a partial so that we
 * can createDefaultIrisGridTheme once, and not per grid.
 */
export type IrisGridThemeContextValue = IrisGridThemeType;

export const IrisGridThemeContext = createContext<{
  theme: IrisGridThemeContextValue | null;
  density: 'compact' | 'regular' | 'spacious';
}>({ theme: null, density: 'regular' });
IrisGridThemeContext.displayName = 'IrisGridThemeContext';

export interface IrisGridThemeProviderProps {
  children: ReactNode;
  /* The density of the grid. Defaults to regular */
  density?: 'compact' | 'regular' | 'spacious';
}

export function IrisGridThemeProvider({
  children,
  density = 'regular',
}: IrisGridThemeProviderProps): JSX.Element {
  const { activeThemes } = useTheme();

  const gridTheme = useMemo(
    () => createDefaultIrisGridTheme(),
    // When the theme changes, we need to update the grid theme which reads CSS variables to JS
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeThemes]
  );

  const contextValue = useMemo(
    () => ({ theme: gridTheme, density }),
    [gridTheme, density]
  );

  return (
    <IrisGridThemeContext.Provider value={contextValue}>
      {children}
    </IrisGridThemeContext.Provider>
  );
}
