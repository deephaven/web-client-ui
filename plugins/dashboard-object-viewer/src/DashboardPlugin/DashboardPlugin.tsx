import React from 'react';
import { DashboardPluginComponentProps, useWidget } from '@deephaven/dashboard';
import ObjectPanel from './ObjectPanel';

export const DashboardPlugin = (
  props: DashboardPluginComponentProps
): JSX.Element => {
  useWidget(
    props,
    ObjectPanel.COMPONENT,
    ObjectPanel,
    widget =>
      widget.type !== dh.VariableType.TABLE &&
      widget.type !== dh.VariableType.FIGURE
  );
  return <></>;
};

export default DashboardPlugin;
