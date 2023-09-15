import { PluginType, DashboardPlugin } from '@deephaven/plugin';
import GridPlugin from './GridPlugin';

const GridPluginConfig: DashboardPlugin = {
  name: 'GridPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: GridPlugin,
};

export default GridPluginConfig;
