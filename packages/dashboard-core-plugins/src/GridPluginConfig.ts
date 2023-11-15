import { PluginType, type WidgetPlugin } from '@deephaven/plugin';
import { dhTable } from '@deephaven/icons';
import { GridPlugin, GridPanelPlugin } from './GridPlugin';

const GridPluginConfig: WidgetPlugin = {
  name: 'IrisGridPanel',
  title: 'Table',
  type: PluginType.WIDGET_PLUGIN,
  component: GridPlugin,
  panelComponent: GridPanelPlugin,
  supportedTypes: ['Table', 'TreeTable', 'HierarchicalTable'],
  icon: dhTable,
};

export default GridPluginConfig;
