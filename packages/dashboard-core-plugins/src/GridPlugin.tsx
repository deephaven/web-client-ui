import { useMemo } from 'react';
import {
  assertIsDashboardPluginProps,
  DashboardPluginComponentProps,
  PanelHydrateFunction,
  useComponent,
} from '@deephaven/dashboard';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { IrisGridPanel } from './panels';

export type GridPluginProps = Partial<DashboardPluginComponentProps> & {
  hydrate: PanelHydrateFunction;
};

export function GridPlugin(props: GridPluginProps): JSX.Element | null {
  assertIsDashboardPluginProps(props);
  const { hydrate } = props;
  const dh = useApi();
  const supportedTypes = useMemo(
    () => [
      dh.VariableType.TABLE,
      dh.VariableType.TREETABLE,
      dh.VariableType.HIERARCHICALTABLE,
    ],
    [dh]
  );

  useComponent(
    props,
    IrisGridPanel.COMPONENT,
    IrisGridPanel,
    supportedTypes,
    hydrate
  );

  return null;
}

export default GridPlugin;
