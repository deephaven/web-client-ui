import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { LoadingOverlay } from '@deephaven/components';
import { updateWorkspaceData } from '@deephaven/redux';
import { Dashboard, type DashboardProps } from './Dashboard';
import { updateDashboardData } from './redux';
import { type DashboardLayoutConfig } from './DashboardLayout';
import { DEFAULT_DASHBOARD_ID } from './DashboardConstants';

export interface LazyDashboardProps extends DashboardProps {
  id: string;
  isActive: boolean;
  plugins: JSX.Element[];
}

export function LazyDashboard({
  id,
  isActive,
  plugins,
  ...rest
}: LazyDashboardProps): JSX.Element {
  const [isLoaded, setIsLoaded] = useState(isActive);
  const dispatch = useDispatch();

  const handleLayoutConfigChange = useCallback(
    (config?: DashboardLayoutConfig) => {
      // TODO: #1746 Call updateDashboardData for every dashboard
      // This currently allows the default dashboard to keep its layout since
      // other dashboards are not persistent yet and we read workspaceData
      // for the default dashboard layout
      if (id === DEFAULT_DASHBOARD_ID) {
        dispatch(updateWorkspaceData({ layoutConfig: config }));
      } else {
        dispatch(updateDashboardData(id, { layoutConfig: config }));
      }
    },
    [id, dispatch]
  );

  if (!isLoaded && isActive) {
    setIsLoaded(true);
  }

  if (!isLoaded) {
    return <LoadingOverlay />;
  }

  return (
    <Dashboard
      id={id}
      onLayoutConfigChange={handleLayoutConfigChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    >
      {plugins}
    </Dashboard>
  );
}

export default LazyDashboard;
