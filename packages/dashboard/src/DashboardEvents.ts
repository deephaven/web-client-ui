import type { EventHub } from '@deephaven/golden-layout';

export const CREATE_DASHBOARD = 'CREATE_DASHBOARD';

export interface CreateDashboardPayload {
  pluginId: string;
  title: string;
  data: unknown;
}

export function listenForCreateDashboard(
  eventHub: EventHub,
  handler: (p: CreateDashboardPayload) => void
): void {
  eventHub.on(CREATE_DASHBOARD, handler);
}

export function emitCreateDashboard(
  eventHub: EventHub,
  payload: CreateDashboardPayload
): void {
  eventHub.emit(CREATE_DASHBOARD, payload);
}
