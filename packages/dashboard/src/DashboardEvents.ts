import { makeEventFunctions } from '@deephaven/golden-layout';

export const CREATE_DASHBOARD = 'CREATE_DASHBOARD';

export const CLOSE_DASHBOARD = 'CLOSE_DASHBOARD';

export interface CreateDashboardPayload<T = unknown> {
  pluginId: string;
  title: string;
  data: T;
}

export const {
  listen: listenForCreateDashboard,
  emit: emitCreateDashboard,
  useListener: useCreateDashboardListener,
} = makeEventFunctions<[detail: CreateDashboardPayload]>(CREATE_DASHBOARD);

export const {
  listen: listenForCloseDashboard,
  emit: emitCloseDashboard,
  useListener: useCloseDashboardListener,
} = makeEventFunctions<[title: string]>(CLOSE_DASHBOARD);
