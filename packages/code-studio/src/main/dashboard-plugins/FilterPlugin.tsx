import React, { ComponentType, useEffect } from 'react';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import { DropdownFilterPanel, InputFilterPanel } from '../../dashboard/panels';

export const FilterPlugin = ({
  id,
  layout,
  registerComponent,
}: DashboardPluginComponentProps): JSX.Element => {
  useEffect(() => {
    const cleanups = [
      registerComponent(
        DropdownFilterPanel.COMPONENT,
        (DropdownFilterPanel as unknown) as ComponentType
      ),
      registerComponent(
        InputFilterPanel.COMPONENT,
        (InputFilterPanel as unknown) as ComponentType
      ),
    ];

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [registerComponent]);

  return <></>;
};

export default FilterPlugin;
