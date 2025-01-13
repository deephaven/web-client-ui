import { type ContextAction, GLOBAL_SHORTCUTS } from '@deephaven/components';
import { exportLogs, logHistory } from '@deephaven/log';
import { store } from '@deephaven/redux';

export function createExportLogsContextAction(
  metadata?: Record<string, unknown>,
  isGlobal = false
): ContextAction {
  return {
    action: () => {
      exportLogs(
        logHistory,
        {
          ...metadata,
          userAgent: navigator.userAgent,
        },
        store.getState()
      );
    },
    shortcut: GLOBAL_SHORTCUTS.EXPORT_LOGS,
    isGlobal,
  };
}

export default createExportLogsContextAction;
