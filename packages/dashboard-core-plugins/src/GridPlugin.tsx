import { useEffect, useState, forwardRef } from 'react';
import { WidgetPanelProps, type WidgetComponentProps } from '@deephaven/plugin';
import { type Table } from '@deephaven/jsapi-types';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  IrisGrid,
  IrisGridModelFactory,
  type IrisGridModel,
} from '@deephaven/iris-grid';
import useHydrateGrid from './useHydrateGrid';
import ConnectedIrisGridPanel, {
  type IrisGridPanel,
} from './panels/IrisGridPanel';

export function GridPlugin(props: WidgetComponentProps): JSX.Element | null {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();

  const { fetch } = props;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const table = (await fetch()) as unknown as Table;
      const newModel = await IrisGridModelFactory.makeModel(dh, table);
      if (!cancelled) {
        setModel(newModel);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch]);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return model ? <IrisGrid model={model} /> : null;
}

export const GridPanelPlugin = forwardRef(
  (props: WidgetPanelProps, ref: React.Ref<IrisGridPanel>) => {
    const { localDashboardId, fetch } = props;
    const hydratedProps = useHydrateGrid(
      fetch as unknown as () => Promise<Table>,
      localDashboardId
    );

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <ConnectedIrisGridPanel ref={ref} {...props} {...hydratedProps} />;
  }
);

GridPanelPlugin.displayName = 'GridPanelPlugin';
