import { PluginType, DashboardPlugin } from '@deephaven/plugin';
import FilterPlugin from './FilterPlugin';

const FilterPluginConfig: DashboardPlugin = {
  name: 'FilterPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: FilterPlugin,
};

export default FilterPluginConfig;
