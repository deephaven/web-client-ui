import { PluginType, DashboardPlugin } from '@deephaven/plugin';
import MarkdownPlugin from './MarkdownPlugin';

const MarkdownPluginConfig: DashboardPlugin = {
  name: 'MarkdownPlugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: MarkdownPlugin,
};

export default MarkdownPluginConfig;
