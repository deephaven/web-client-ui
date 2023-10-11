import { PluginType, DashboardPlugin } from '@deephaven/plugin';
import PandasPlugin from './PandasPlugin';

const PandasPluginConfig: DashboardPlugin = {
  name: 'PandasPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: PandasPlugin,
};

export default PandasPluginConfig;
