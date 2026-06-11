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
 * The theme portion of the IrisGrid context value.
 * This must be a full object and not a partial so that we
 * can createDefaultIrisGridTheme once, and not per grid.
 */
export type IrisGridThemeContextValue = IrisGridThemeType;

/**
 * Internal context that carries only the theme and density.
 * Provided by IrisGridThemeProvider and consumed by IrisGridContextProvider.
 * Not intended for direct use outside this file.
 */
const IrisGridThemeOnlyContext = createContext<{
  theme: IrisGridThemeContextValue | null;
  density: 'compact' | 'regular' | 'spacious';
}>({ theme: null, density: 'regular' });

/**
 * Combined context consumed by IrisGrid via static contextType.
 * Provided by IrisGridContextProvider which combines the theme (from
 * IrisGridThemeOnlyContext) and the renderer registry (from CellInputRendererContext).
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

// ---------------------------------------------------------------------------
// IrisGridThemeProvider
// Bootstrap concern: provides theme + density. Mount in ThemeBootstrap.
// ---------------------------------------------------------------------------

export interface IrisGridThemeProviderProps {
  children: ReactNode;
  /** The density of the grid. Defaults to regular */
  density?: 'compact' | 'regular' | 'spacious';
}

/**
 * Provides the IrisGrid theme and density to all IrisGridContextProviders
 * in the subtree. Should be mounted once near the app root in ThemeBootstrap
 * alongside other theme providers.
 */
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
    <IrisGridThemeOnlyContext.Provider value={contextValue}>
      {children}
    </IrisGridThemeOnlyContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// IrisGridContextProvider
// Combiner: reads IrisGridThemeOnlyContext + CellInputRendererContext and
// provides the unified IrisGridContext that IrisGrid consumes. Mount this
// directly above each IrisGrid instance (LazyIrisGrid does this automatically).
// ---------------------------------------------------------------------------

export interface IrisGridContextProviderProps {
  children: ReactNode;
}

/**
 * Combines the IrisGrid theme (from IrisGridThemeProvider) and the cell input
 * renderer registry (from CellInputRendererContext) into a single IrisGridContext
 * value for IrisGrid to consume via its static contextType.
 *
 * DHE (or any consumer) can inject custom cell input renderers by mounting a
 * CellInputRendererContext.Provider above this in the tree.
 */
export function IrisGridContextProvider({
  children,
}: IrisGridContextProviderProps): JSX.Element {
  const { theme, density } = useContext(IrisGridThemeOnlyContext);
  const cellInputRendererRegistry = useContext(CellInputRendererContext);

  const contextValue = useMemo(
    () => ({ theme, density, cellInputRendererRegistry }),
    [theme, density, cellInputRendererRegistry]
  );

  return (
    <IrisGridContext.Provider value={contextValue}>
      {children}
    </IrisGridContext.Provider>
  );
}
