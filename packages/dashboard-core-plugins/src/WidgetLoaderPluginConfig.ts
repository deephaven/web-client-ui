import { PluginType, DashboardPlugin } from '@deephaven/plugin';
import WidgetLoaderPlugin from './WidgetLoaderPlugin';

const WidgetLoaderPluginConfig: DashboardPlugin = {
  name: 'WidgetLoaderPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: WidgetLoaderPlugin,
};

export default WidgetLoaderPluginConfig;
