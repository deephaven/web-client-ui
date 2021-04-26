import dh from '@deephaven/jsapi-shim';
import ChartModelFactory from './ChartModelFactory';
import FigureChartModel from './FigureChartModel';

describe('creating model from metadata', () => {
  it('handles loading a FigureChartModel from table settings', async () => {
    const columns = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    const table = new dh.Table({ columns });
    const settings = { series: ['C'], xAxis: 'name' };
    const model = await ChartModelFactory.makeModelFromSettings(
      settings,
      table
    );

    expect(model).toBeInstanceOf(FigureChartModel);
  });
});
