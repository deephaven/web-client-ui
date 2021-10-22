import React, { useEffect } from 'react';
import {
  DashboardPluginComponentProps,
  DashboardUtils,
  PanelHydrateFunction,
} from '@deephaven/dashboard';
import { PandasPanel } from './panels';

export type PandasPluginComponentProps = DashboardPluginComponentProps & {
  hydrate: PanelHydrateFunction;
};

export const PandasPlugin = ({
  hydrate = DashboardUtils.hydrate,
  registerComponent,
}: PandasPluginComponentProps): JSX.Element => {
  useEffect(() => {
    const cleanups = [
      registerComponent(PandasPanel.COMPONENT, PandasPanel, hydrate),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [hydrate, registerComponent]);

  return <></>;
};

export default PandasPlugin;
