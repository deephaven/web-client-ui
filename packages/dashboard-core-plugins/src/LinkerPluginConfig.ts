import { PluginType, DashboardPlugin } from '@deephaven/plugin';
import LinkerPlugin from './LinkerPlugin';

const LinkerPluginConfig: DashboardPlugin = {
  name: 'LinkerPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: LinkerPlugin,
};

export default LinkerPluginConfig;
