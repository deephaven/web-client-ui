import type { EventHub } from '@deephaven/golden-layout';

export const CREATE_DASHBOARD = 'CREATE_DASHBOARD';

export interface CreateDashboardPayload<T = unknown> {
  pluginId: string;
  title: string;
  data: T;
}

export function stopListenForCreateDashboard<T = unknown>(
  eventHub: EventHub,
  handler: (p: CreateDashboardPayload<T>) => void
): void {
  eventHub.off(CREATE_DASHBOARD, handler);
}

export function listenForCreateDashboard<T = unknown>(
  eventHub: EventHub,
  handler: (p: CreateDashboardPayload<T>) => void
): () => void {
  eventHub.on(CREATE_DASHBOARD, handler);
  return () => stopListenForCreateDashboard(eventHub, handler);
}

export function emitCreateDashboard<T = unknown>(
  eventHub: EventHub,
  payload: CreateDashboardPayload<T>
): void {
  eventHub.emit(CREATE_DASHBOARD, payload);
}
