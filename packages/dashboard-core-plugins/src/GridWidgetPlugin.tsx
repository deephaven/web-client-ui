import { useEffect, useState } from 'react';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { type Table } from '@deephaven/jsapi-types';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  IrisGrid,
  IrisGridModelFactory,
  type IrisGridModel,
} from '@deephaven/iris-grid';

export function GridWidgetPlugin(
  props: WidgetComponentProps
): JSX.Element | null {
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

export default GridWidgetPlugin;
