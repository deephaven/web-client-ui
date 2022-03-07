import React from 'react';
import { DashboardPluginComponentProps, useWidget } from '@deephaven/dashboard';
import MatPlotLibPanel from './MatPlotLibPanel';

export const VARIABLE_TYPE = 'matplotlib.figure.Figure';

export const DashboardPlugin = (
  props: DashboardPluginComponentProps
): JSX.Element => {
  useWidget(props, MatPlotLibPanel.COMPONENT, MatPlotLibPanel, VARIABLE_TYPE);
  return <></>;
};

export default DashboardPlugin;
