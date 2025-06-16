import { createContext, useContext } from 'react';

export const DashboardIdContext = createContext<string | null>(null);

export function useDashboardId(): string {
  const dashboardId = useContext(DashboardIdContext);
  if (dashboardId == null) {
    throw new Error(
      'useDashboardId must be used within a DashboardIdContext provider'
    );
  }
  return dashboardId;
}
