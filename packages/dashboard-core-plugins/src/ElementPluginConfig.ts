import { PluginType, DashboardPlugin } from '@deephaven/plugin';
import ElementPlugin from './ElementPlugin';

const ElementPluginConfig: DashboardPlugin = {
  name: 'ElementPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: ElementPlugin,
};

export default ElementPluginConfig;
