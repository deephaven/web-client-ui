import React, { useEffect } from 'react';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import { PandasPanel } from '../../dashboard/panels';

export const PandasPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  useEffect(() => {
    const cleanups = [registerComponent(PandasPanel.COMPONENT, PandasPanel)];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  return <></>;
};

export default PandasPlugin;
