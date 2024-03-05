import { useEffect, useState } from 'react';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  IrisGrid,
  IrisGridModelFactory,
  type IrisGridModel,
} from '@deephaven/iris-grid';

export function GridWidgetPlugin(
  props: WidgetComponentProps<dh.Table>
): JSX.Element | null {
  const dh = useApi();
  const [model, setModel] = useState<IrisGridModel>();

  const { fetch } = props;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const table = await fetch();
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

  return model ? <IrisGrid model={model} /> : null;
}

export default GridWidgetPlugin;
