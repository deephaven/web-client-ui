import dh from '@deephaven/jsapi-shim';
import ChartModelFactory from './ChartModelFactory';
import FigureChartModel from './FigureChartModel';

describe('creating model from metadata', () => {
  it('handles loading a FigureChartModel from table settings', async () => {
    const columns = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const table = new (dh as any).Table({ columns });
    const settings = { series: ['C'], xAxis: 'name', type: 'PIE' as const };
    const model = await ChartModelFactory.makeModelFromSettings(
      dh,
      settings,
      table
    );

    expect(model).toBeInstanceOf(FigureChartModel);
  });
});
