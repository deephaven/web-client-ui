import React from 'react';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
} from '@deephaven/dashboard';
import { dh as DhType } from '@deephaven/jsapi-types';
import Linker from './linker/Linker';

export type LinkerPluginProps = Partial<DashboardPluginComponentProps> & {
  dh: DhType;
};

export function LinkerPlugin(props: LinkerPluginProps): JSX.Element {
  assertIsDashboardPluginProps(props);
  const { dh, id, layout, panelManager } = props;
  return (
    <Linker
      dh={dh}
      layout={layout}
      localDashboardId={id}
      panelManager={panelManager}
    />
  );
}

export default LinkerPlugin;
