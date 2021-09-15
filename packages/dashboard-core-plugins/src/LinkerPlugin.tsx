import React from 'react';
import { DashboardPluginComponentProps } from '@deephaven/dashboard';
import Linker from './linker/Linker';

export const LinkerPlugin = ({
  id,
  layout,
  panelManager,
}: DashboardPluginComponentProps): JSX.Element => (
  <Linker layout={layout} localDashboardId={id} panelManager={panelManager} />
);

export default LinkerPlugin;
