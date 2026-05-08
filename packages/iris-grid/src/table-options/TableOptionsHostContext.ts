import { createContext, useContext } from 'react';
import type {
  GridStateSnapshot,
  GridDispatch,
  TableOption,
} from './TableOption';

/**
 * Context value for the Table Options Host.
 * Provides grid state, dispatch, and navigation to option panels.
 */
export interface TableOptionsHostContextValue {
  /** Read-only snapshot of grid state */
  gridState: GridStateSnapshot;

  /** Dispatch function to modify grid state */
  dispatch: GridDispatch;

  /** Open a sub-panel */
  openSubPanel: (option: TableOption) => void;

  /** Close the current panel (go back to menu or previous panel) */
  closePanel: () => void;

  /** Alias for closePanel - go back to menu or previous panel */
  goBack: () => void;
}

/**
 * Context for Table Options panels.
 * Provides access to grid state, dispatch, and navigation.
 */
export const TableOptionsHostContext =
  createContext<TableOptionsHostContextValue | null>(null);
TableOptionsHostContext.displayName = 'TableOptionsHostContext';

/**
 * Hook to access the Table Options Host context.
 * Use this in option panels to access grid state and dispatch.
 *
 * @returns The context value
 * @throws Error if used outside of TableOptionsHostContext.Provider
 *
 * @example
 * function SelectDistinctPanel() {
 *   const { gridState, dispatch, closePanel } = useTableOptionsHost();
 *   const { model, selectDistinctColumns } = gridState;
 *
 *   const handleChange = (columns: string[]) => {
 *     dispatch({ type: 'SET_SELECT_DISTINCT_COLUMNS', columns });
 *   };
 *
 *   return <SelectDistinctBuilder model={model} ... />;
 * }
 */
export function useTableOptionsHost(): TableOptionsHostContextValue {
  const context = useContext(TableOptionsHostContext);
  if (context == null) {
    throw new Error(
      'useTableOptionsHost must be used within a TableOptionsHostContext.Provider'
    );
  }
  return context;
}
