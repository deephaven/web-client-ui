import { createContext, useContext } from 'react';

/**
 * Context to provide the golden layout panel ID.
 */
export const PanelIdContext = createContext<string | null>(null);

/**
 * Gets the current panel ID from the nearest context.
 * @returns The current panel ID from the context, or null if not set or there is no context.
 */
export function usePanelId(): string | null {
  return useContext(PanelIdContext);
}
