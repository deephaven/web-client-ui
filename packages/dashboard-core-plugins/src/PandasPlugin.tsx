import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  useDashboardPanel,
} from '@deephaven/dashboard';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { PandasPanel } from './panels';
import useHydrateGrid from './useHydrateGrid';

export function PandasPlugin(
  props: DashboardPluginComponentProps
): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const dh = useApi();
  const hydrate = useHydrateGrid();

  useDashboardPanel({
    dashboardProps: props,
    componentName: PandasPanel.COMPONENT,
    component: PandasPanel,
    supportedTypes: dh.VariableType.PANDAS,
    hydrate,
  });

  return null;
}

export default PandasPlugin;
