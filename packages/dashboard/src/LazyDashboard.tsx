import React, { useEffect, useState } from 'react';
import { LoadingOverlay } from '@deephaven/components';
import type { ItemConfigType } from '@deephaven/golden-layout';
import { Dashboard, DashboardProps } from './Dashboard';

export interface LazyDashboardProps
  extends Omit<DashboardProps, 'layoutConfig'> {
  id: string;
  getLayoutConfig: () => Promise<ItemConfigType[]>;
  plugins: JSX.Element[];
}

export function LazyDashboard({
  getLayoutConfig,
  plugins,
  ...rest
}: LazyDashboardProps): JSX.Element {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const isLoading = !isLoaded && error == null;
  const [layoutConfig, setLayoutConfig] = useState<ItemConfigType[]>([]);

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
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Dashboard layoutConfig={layoutConfig} {...rest}>
      {plugins}
    </Dashboard>
  );
}

export default LazyDashboard;
