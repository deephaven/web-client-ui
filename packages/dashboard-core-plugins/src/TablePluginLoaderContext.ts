import { createContext } from 'react';
import { type TablePluginComponent } from '@deephaven/plugin';

/**
 * Context providing an optional function to load a table plugin by name.
 * When provided, `useLoadTablePlugin` will call this function before falling
 * back to the built-in plugin registry lookup.
 */
export const TablePluginLoaderContext = createContext<
  ((name: string) => TablePluginComponent) | null
>(null);
TablePluginLoaderContext.displayName = 'TablePluginLoaderContext';

export default TablePluginLoaderContext;
