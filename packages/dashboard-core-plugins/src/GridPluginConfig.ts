import { PluginType, type WidgetPlugin } from '@deephaven/plugin';
import { dhTable } from '@deephaven/icons';
import { Table } from '@deephaven/jsapi-types';
import { GridWidgetPlugin } from './GridWidgetPlugin';
import { GridPanelPlugin } from './GridPanelPlugin';

const GridPluginConfig: WidgetPlugin<Table> = {
  name: 'IrisGridPanel',
  title: 'Table',
  type: PluginType.WIDGET_PLUGIN,
  component: GridWidgetPlugin,
  panelComponent: GridPanelPlugin,
  supportedTypes: [
    'Table',
    'TreeTable',
    'HierarchicalTable',
    'PartitionedTable',
  ],
  icon: dhTable,
};

export default GridPluginConfig;
