import { useMemo } from 'react';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  useDashboardPanel,
} from '@deephaven/dashboard';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { IrisGridPanel } from './panels';
import useHydrateGrid from './useHydrateGrid';

export function GridPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const dh = useApi();
  const hydrate = useHydrateGrid();

  const supportedTypes = useMemo(
    () => [
      dh.VariableType.TABLE,
      dh.VariableType.TREETABLE,
      dh.VariableType.HIERARCHICALTABLE,
      dh.VariableType.PARTITIONEDTABLE,
    ],
    [dh]
  );

  useDashboardPanel({
    dashboardProps: props,
    componentName: IrisGridPanel.COMPONENT,
    component: IrisGridPanel,
    supportedTypes,
    hydrate,
  });

  return null;
}

export default GridPlugin;
