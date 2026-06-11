import { createContext, type ReactNode, useContext, useMemo } from 'react';
import { type CellInputRendererRegistry } from '@deephaven/grid';
import CellInputRendererContext, {
  DEFAULT_REGISTRY,
} from './CellInputRendererContext';
import {
  IrisGridThemeContext,
  type IrisGridThemeContextValue,
} from './IrisGridThemeProvider';

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
// IrisGridContextProvider
// Combiner: reads IrisGridThemeContext + CellInputRendererContext and
// provides the unified IrisGridContext that IrisGrid consumes.
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
  const { theme, density } = useContext(IrisGridThemeContext);
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
