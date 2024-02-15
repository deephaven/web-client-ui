import { useEffect, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import { Chart, ChartModel, ChartModelFactory } from '@deephaven/chart';
import type { Figure } from '@deephaven/jsapi-types';
import { type WidgetComponentProps } from '@deephaven/plugin';

export function ChartWidgetPlugin(
  props: WidgetComponentProps<Figure>
): JSX.Element | null {
  const dh = useApi();
  const [model, setModel] = useState<ChartModel>();

  const { fetch } = props;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const figure = (await fetch()) as unknown as Figure;
      const newModel = await ChartModelFactory.makeModel(dh, undefined, figure);

      if (!cancelled) {
        setModel(newModel);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch]);

  return model ? <Chart model={model} /> : null;
}

export default ChartWidgetPlugin;
