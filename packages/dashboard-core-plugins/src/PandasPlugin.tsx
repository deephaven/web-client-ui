import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  PanelHydrateFunction,
  useComponent,
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

  useComponent(
    props,
    PandasPanel.COMPONENT,
    PandasPanel,
    dh.VariableType.PANDAS,
    hydrate
  );

  return null;
}

export default PandasPlugin;
