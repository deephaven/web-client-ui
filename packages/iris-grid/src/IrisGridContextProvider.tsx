import { useTheme } from '@deephaven/components';
import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { type CellInputRendererRegistry } from '@deephaven/grid';
import CellInputRendererContext, {
  DEFAULT_REGISTRY,
} from './CellInputRendererContext';
import {
  createDefaultIrisGridTheme,
  type IrisGridThemeType,
} from './IrisGridTheme';

/**
 * The context value for the IrisGridContextProvider.
 * This must be a full object and not a partial so that we
 * can createDefaultIrisGridTheme once, and not per grid.
 */
export type IrisGridThemeContextValue = IrisGridThemeType;

/**
 * The context for the IrisGrid, providing the theme, density, and cell input renderer registry.
 */
export const IrisGridContext = createContext<{
  theme: IrisGridThemeContextValue | null;
  density: 'compact' | 'regular' | 'spacious';
  cellInputRendererRegistry: CellInputRendererRegistry;
}>({
  theme: null,
  density: 'regular',
  cellInputRendererRegistry: DEFAULT_REGISTRY,
});
IrisGridContext.displayName = 'IrisGridContext';

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

  const gridTheme = useMemo(
    () => createDefaultIrisGridTheme(),
    // When the theme changes, we need to update the grid theme which reads CSS variables to JS
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeThemes]
  );

  const cellInputRendererRegistry = useContext(CellInputRendererContext);

  const contextValue = useMemo(
    () => ({
      theme: gridTheme,
      density,
      cellInputRendererRegistry,
    }),
    [gridTheme, density, cellInputRendererRegistry]
  );

  return (
    <IrisGridContext.Provider value={contextValue}>
      {children}
    </IrisGridContext.Provider>
  );
}
