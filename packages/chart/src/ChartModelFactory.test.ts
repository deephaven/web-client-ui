import dh from '@deephaven/jsapi-shim';
import { TestUtils } from '@deephaven/utils';
import ChartModelFactory from './ChartModelFactory';
import type { ChartTheme } from './ChartTheme';
import FigureChartModel from './FigureChartModel';

const { createMockProxy } = TestUtils;

describe('creating model from metadata', () => {
  it('handles loading a FigureChartModel from table settings', async () => {
    const columns = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = new (dh as any).Table({ columns });
    const settings = { series: ['C'], xAxis: 'name', type: 'PIE' as const };
    const chartTheme = createMockProxy<ChartTheme>();
    const model = await ChartModelFactory.makeModelFromSettings(
      dh,
      settings,
      table,
      chartTheme
    );

    expect(model).toBeInstanceOf(FigureChartModel);
  });
});
