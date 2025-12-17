import { useCallback, useState, type PropsWithChildren } from 'react';
import Log from '@deephaven/log';
import { PersistentStateProvider } from './PersistentStateContext';
import type { PanelProps } from './DashboardPlugin';

const log = Log.module('DashboardPanelWrapper');

export function DashboardPanelWrapper({
  glContainer,
  children,
}: PropsWithChildren<PanelProps>): JSX.Element {
  const handleDataChange = useCallback(
    (data: unknown) => {
      glContainer.setPersistedState(data);
    },
    [glContainer]
  );

  const { persistedState } = glContainer.getConfig();

  // Use a state initializer so we can warn once if the persisted state is invalid
  const [initialPersistedState] = useState(() => {
    if (persistedState != null && !Array.isArray(persistedState)) {
      log.warn(
        `Persisted state is type ${typeof persistedState}. Expected array. Setting to empty array.`
      );
      return [];
    }
    return persistedState ?? [];
  });

  return (
    <PersistentStateProvider
      initialState={initialPersistedState}
      onChange={handleDataChange}
    >
      {children}
    </PersistentStateProvider>
  );
}

export default DashboardPanelWrapper;
