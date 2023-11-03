import { PluginType, type WidgetPlugin } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import ChartPlugin from './ChartPlugin';

const ChartPluginConfig: WidgetPlugin = {
  name: 'ChartPanel',
  title: 'Chart',
  type: PluginType.WIDGET_PLUGIN,
  component: ChartPlugin,
  panelComponent: ChartPlugin,
  supportedTypes: 'Figure',
  icon: vsGraph,
};

export default ChartPluginConfig;
