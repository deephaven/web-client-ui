import dh from '@deephaven/jsapi-shim';
import Plotly from 'plotly.js/lib/core.js';
import ChartUtils from '../ChartUtils';

const chartUtils = new ChartUtils(dh);

describe('Plotly bundle', () => {
  it('core registers the scatter trace used when WebGL is unavailable', () => {
    expect(
      chartUtils.getPlotlyChartType(dh.plot.SeriesPlotStyle.SCATTER, true)
    ).toBe('scatter');
    expect(
      chartUtils.getPlotlyChartType(dh.plot.SeriesPlotStyle.LINE, false, false)
    ).toBe('scatter');

    const { traces } = (
      Plotly as unknown as {
        PlotSchema: { get: () => { traces: Record<string, unknown> } };
      }
    ).PlotSchema.get();
    expect(traces).toHaveProperty('scatter');
  });
});
