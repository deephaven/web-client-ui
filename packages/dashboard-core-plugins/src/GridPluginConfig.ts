import { PluginType, type WidgetPlugin } from '@deephaven/plugin';
import { dhTable } from '@deephaven/icons';
import GridPlugin from './GridPlugin';

const GridPluginConfig: WidgetPlugin = {
  name: 'IrisGridPanel',
  title: 'Table',
  type: PluginType.WIDGET_PLUGIN,
  component: GridPlugin,
  panelComponent: GridPlugin,
  supportedTypes: ['Table', 'TreeTable', 'HierarchicalTable'],
  icon: dhTable,
};

export default GridPluginConfig;
