import { PluginType, type WidgetPlugin } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { ChartWidgetPlugin } from './ChartWidgetPlugin';
import { ChartPanelPlugin } from './ChartPanelPlugin';

const ChartPluginConfig: WidgetPlugin<dh.plot.Figure> = {
  name: 'ChartPanel',
  title: 'Chart',
  type: PluginType.WIDGET_PLUGIN,
  component: ChartWidgetPlugin,
  panelComponent: ChartPanelPlugin,
  supportedTypes: 'Figure',
  icon: vsGraph,
};

export default ChartPluginConfig;
