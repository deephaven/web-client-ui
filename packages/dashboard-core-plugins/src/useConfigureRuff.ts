import { useEffect } from 'react';
import { MonacoProviders } from '@deephaven/console';
import { useAppSelector } from '@deephaven/dashboard';
import { getNotebookSettings } from '@deephaven/redux';

/**
 * Hook to configure Ruff settings in Monaco.
 * The enabled status and settings are read from redux.
 * Any changes to the redux values will be applied to the Monaco providers.
 */
export function useConfigureRuff(): void {
  const { python: { linter = {} } = {} } = useAppSelector(getNotebookSettings);
  const { isEnabled: ruffEnabled = false, config: ruffConfig } = linter;
  useEffect(
    function setRuffSettings() {
      MonacoProviders.isRuffEnabled = ruffEnabled;
      MonacoProviders.setRuffSettings(ruffConfig); // Also inits Ruff if needed
    },
    [ruffEnabled, ruffConfig]
  );
}

export default useConfigureRuff;
