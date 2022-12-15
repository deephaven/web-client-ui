import React from 'react';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
} from '@deephaven/dashboard';
import Linker from './linker/Linker';

export type LinkerPluginProps = Partial<DashboardPluginComponentProps>;

export function LinkerPlugin(props: LinkerPluginProps): JSX.Element {
  assertIsDashboardPluginProps(props);
  const { id, layout, panelManager } = props;
  return (
    <Linker layout={layout} localDashboardId={id} panelManager={panelManager} />
  );
}

export default LinkerPlugin;
