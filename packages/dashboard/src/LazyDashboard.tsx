import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { LoadingOverlay } from '@deephaven/components';
import type { ItemConfigType } from '@deephaven/golden-layout';
import { Dashboard, DashboardProps } from './Dashboard';
import { updateDashboardData } from './redux';
import { DashboardLayoutConfig } from './DashboardLayout';

export interface LazyDashboardProps
  extends Omit<DashboardProps, 'layoutConfig'> {
  id: string;
  getLayoutConfig: () => Promise<ItemConfigType[]>;
  plugins: JSX.Element[];
}

export function LazyDashboard({
  getLayoutConfig,
  plugins,
  id,
  ...rest
}: LazyDashboardProps): JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const isLoading = !isLoaded && error == null;
  const [layoutConfig, setLayoutConfig] = useState<ItemConfigType[]>([]);
  const dispatch = useDispatch();

  const handleLayoutConfigChange = useCallback(
    (config?: DashboardLayoutConfig) => {
      dispatch(updateDashboardData(id, { layoutConfig: config }));
    },
    [id, dispatch]
  );

  useEffect(() => {
    let isCanceled = false;
    if (isLoaded) {
      return;
    }
    getLayoutConfig()
      .then(config => {
        if (isCanceled) {
          return;
        }
        setLayoutConfig(config);
        setIsLoaded(true);
      })
      .catch(e => {
        if (isCanceled) {
          return;
        }
        setError(`Error loading dashboard: ${e}`);
      });

    return () => {
      isCanceled = true;
    };
  }, [getLayoutConfig, isLoaded]);

  if (!isLoaded || error != null) {
    return (
      <LoadingOverlay
        isLoading={isLoading}
        isLoaded={isLoaded}
        errorMessage={error}
      />
    );
  }

  return (
    <Dashboard
      id={id}
      layoutConfig={layoutConfig}
      onLayoutConfigChange={handleLayoutConfigChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    >
      {plugins}
    </Dashboard>
  );
}

export default LazyDashboard;
