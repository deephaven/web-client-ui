import { useTheme } from '@deephaven/components';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { type CellInputRendererRegistry } from '@deephaven/grid';
import {
  createDefaultIrisGridTheme,
  type IrisGridThemeType,
} from './IrisGridTheme';
import CellInputRendererContext, {
  DEFAULT_REGISTRY,
} from './CellInputRendererContext';

/**
 * The context value for the IrisGridThemeProvider.
 * This must be a full object and not a partial so that we
 * can createDefaultIrisGridTheme once, and not per grid.
 */
export type IrisGridThemeContextValue = IrisGridThemeType;

export const IrisGridThemeContext = createContext<{
  theme: IrisGridThemeContextValue | null;
  density: 'compact' | 'regular' | 'spacious';
  cellInputRendererRegistry: CellInputRendererRegistry;
}>({
  theme: null,
  density: 'regular',
  cellInputRendererRegistry: DEFAULT_REGISTRY,
});
IrisGridThemeContext.displayName = 'IrisGridThemeContext';

/**
 * Provides the IrisGrid theme and cell input renderer registry to all
 * IrisGrid instances in the subtree. Reads the CellInputRendererRegistry
 * from CellInputRendererContext so that DHE (or any other consumer) can
 * supply custom renderers simply by wrapping with CellInputRendererContext.Provider.
 */
export interface IrisGridContextProviderProps {
  children: ReactNode;
  /* The density of the grid. Defaults to regular */
  density?: 'compact' | 'regular' | 'spacious';
}

export function IrisGridContextProvider({
  children,
  density = 'regular',
}: IrisGridContextProviderProps): JSX.Element {
  const { activeThemes } = useTheme();
  const cellInputRendererRegistry = useContext(CellInputRendererContext);

  const gridTheme = useMemo(
    () => createDefaultIrisGridTheme(),
    // When the theme changes, we need to update the grid theme which reads CSS variables to JS
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeThemes]
  );

  const contextValue = useMemo(
    () => ({ theme: gridTheme, density, cellInputRendererRegistry }),
    [gridTheme, density, cellInputRendererRegistry]
  );

  return (
    <IrisGridThemeContext.Provider value={contextValue}>
      {children}
    </IrisGridThemeContext.Provider>
  );
}
