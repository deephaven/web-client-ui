import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  PanelHydrateFunction,
  useDashboardPanel,
} from '@deephaven/dashboard';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { ChartPanel } from './panels';

export type ChartPluginProps = Partial<DashboardPluginComponentProps> & {
  hydrate: PanelHydrateFunction;
};

export function ChartPlugin(props: ChartPluginProps): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const { hydrate } = props;
  const dh = useApi();
  useDashboardPanel({
    dashboardProps: props,
    componentName: ChartPanel.COMPONENT,
    component: ChartPanel,
    supportedTypes: dh.VariableType.FIGURE,
    hydrate,
  });

  return null;
}

export default ChartPlugin;
