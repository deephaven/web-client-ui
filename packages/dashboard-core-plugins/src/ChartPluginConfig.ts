import { PluginType, DashboardPlugin } from '@deephaven/plugin';
import ChartPlugin from './ChartPlugin';

const ChartPluginConfig: DashboardPlugin = {
  name: 'ChartPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: ChartPlugin,
  supportedTypes: ['Figure'],
};

export default ChartPluginConfig;
