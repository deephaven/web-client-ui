import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  PanelHydrateFunction,
  useDashboardPanel,
} from '@deephaven/dashboard';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { PandasPanel } from './panels';

export type PandasPluginProps = Partial<DashboardPluginComponentProps> & {
  hydrate: PanelHydrateFunction;
};

export function PandasPlugin(props: PandasPluginProps): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const { hydrate } = props;
  const dh = useApi();

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
