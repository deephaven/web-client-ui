import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { LoadingOverlay } from '@deephaven/components';
import { Dashboard, DashboardProps } from './Dashboard';
import { updateDashboardData } from './redux';
import { DashboardLayoutConfig } from './DashboardLayout';

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
      dispatch(updateDashboardData(id, { layoutConfig: config }));
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
