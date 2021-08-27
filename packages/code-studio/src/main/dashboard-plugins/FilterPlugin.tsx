import React, { ComponentType, useCallback, useEffect } from 'react';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import { DropdownFilterPanel, InputFilterPanel } from '../../dashboard/panels';

export const FilterPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  const registerComponents = useCallback(() => {
    registerComponent(
      DropdownFilterPanel.COMPONENT,
      (DropdownFilterPanel as unknown) as ComponentType
    );
    registerComponent(
      InputFilterPanel.COMPONENT,
      (InputFilterPanel as unknown) as ComponentType
    );
  }, [registerComponent]);

  useEffect(() => {
    registerComponents();
  }, [registerComponents]);

  return <></>;
};

export default FilterPlugin;
