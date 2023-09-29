import { PluginType, DashboardPlugin } from '@deephaven/plugin';
import ChartBuilderPlugin from './ChartBuilderPlugin';

const ChartBuilderPluginConfig: DashboardPlugin = {
  name: 'ChartBuilderPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: ChartBuilderPlugin,
};

export default ChartBuilderPluginConfig;
