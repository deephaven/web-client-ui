import { useEffect, useState } from 'react';
import { type WidgetComponentProps } from '@deephaven/plugin';
import { type dh } from '@deephaven/jsapi-types';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  IrisGrid,
  IrisGridModelFactory,
  type IrisGridModel,
} from '@deephaven/iris-grid';
import { useSelector } from 'react-redux';
import { getSettings, RootState } from '@deephaven/redux';

export function GridWidgetPlugin(
  props: WidgetComponentProps<dh.Table>
): JSX.Element | null {
  const dh = useApi();
  const settings = useSelector(getSettings<RootState>);
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

  return model ? <IrisGrid model={model} settings={settings} /> : null;
}

export default GridWidgetPlugin;
