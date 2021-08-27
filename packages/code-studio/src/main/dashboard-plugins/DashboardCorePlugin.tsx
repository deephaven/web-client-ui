import React from 'react';
import { DashboardPluginComponentProps } from '../../dashboard/DashboardPlugin';
import GridPlugin from './GridPlugin';
import ChartPlugin from './ChartPlugin';
import ConsolePlugin from './ConsolePlugin';
import FilterPlugin from './FilterPlugin';
import PandasPlugin from './PandasPlugin';
import LinkerPlugin from './LinkerPlugin';

export const DashboardCorePlugin = ({
  id,
  layout,
  panelManager,
  registerComponent,
}: DashboardPluginComponentProps): React.ReactNode => (
  <>
    <GridPlugin
      layout={layout}
      id={id}
      panelManager={panelManager}
      registerComponent={registerComponent}
    />
    <ChartPlugin
      layout={layout}
      id={id}
      panelManager={panelManager}
      registerComponent={registerComponent}
    />
    <ConsolePlugin
      layout={layout}
      id={id}
      panelManager={panelManager}
      registerComponent={registerComponent}
    />
    <FilterPlugin
      layout={layout}
      id={id}
      panelManager={panelManager}
      registerComponent={registerComponent}
    />
    <PandasPlugin
      layout={layout}
      id={id}
      panelManager={panelManager}
      registerComponent={registerComponent}
    />
    <LinkerPlugin
      layout={layout}
      id={id}
      panelManager={panelManager}
      registerComponent={registerComponent}
    />
  </>
);

export default DashboardCorePlugin;
