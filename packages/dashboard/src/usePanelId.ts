import { createContext, useContext } from 'react';
import { type PanelId } from './layout';

export const PanelIdContext = createContext<PanelId | null>(null);

export function usePanelId(): PanelId {
  const panelId = useContext(PanelIdContext);
  if (panelId == null) {
    throw new Error('usePanelId must be used within a PanelIdContext provider');
  }
  return panelId;
}
