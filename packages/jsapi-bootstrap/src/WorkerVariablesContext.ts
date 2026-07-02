import { createContext } from 'react';
import type { WorkerVariablesStore } from '@deephaven/jsapi-utils';

/**
 * Context providing a {@link WorkerVariablesStore} that delivers push-based,
 * ref-counted worker variable lists. `null` when the host does not expose
 * field-update subscriptions; consumers must handle the missing-provider case.
 */
export const WorkerVariablesContext =
  createContext<WorkerVariablesStore | null>(null);

WorkerVariablesContext.displayName = 'WorkerVariablesContext';

export default WorkerVariablesContext;
