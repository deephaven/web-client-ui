import React, { useCallback, useEffect } from 'react';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import { PandasPanel } from '../../dashboard/panels';

export const PandasPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const registerComponents = useCallback(() => {
    registerComponent(PandasPanel.COMPONENT, PandasPanel);
  }, [registerComponent]);

  useEffect(() => {
    registerComponents();
  }, [registerComponents]);

  return <></>;
};

export default PandasPlugin;
