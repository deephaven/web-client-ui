import { useEffect, useState } from 'react';
import { useApi } from '@deephaven/jsapi-bootstrap';
import {
  Chart,
  ChartModel,
  ChartModelFactory,
  useChartTheme,
} from '@deephaven/chart';
import type { Figure } from '@deephaven/jsapi-types';
import { type WidgetComponentProps } from '@deephaven/plugin';

export function ChartWidgetPlugin(
  props: WidgetComponentProps
): JSX.Element | null {
  const dh = useApi();
  const chartTheme = useChartTheme();
  const [model, setModel] = useState<ChartModel>();

  const { fetch } = props;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const figure = (await fetch()) as unknown as Figure;
      const newModel = await ChartModelFactory.makeModel(
        dh,
        undefined,
        figure,
        chartTheme
      );

      if (!cancelled) {
        setModel(newModel);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [dh, fetch, chartTheme]);

  return model ? <Chart model={model} /> : null;
}

export default ChartWidgetPlugin;
