import { PluginType, type WidgetPlugin } from '@deephaven/plugin';
import { dhTable } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { SimplePivotWidgetPlugin } from './SimplePivotWidgetPlugin';

const SimplePivotPluginConfig: WidgetPlugin<dh.Widget> = {
  name: 'SimplePivotPanel',
  title: 'SimplePivot',
  type: PluginType.WIDGET_PLUGIN,
  component: SimplePivotWidgetPlugin,
  supportedTypes: 'simplepivot.SimplePivotTable',
  icon: dhTable,
};

export default SimplePivotPluginConfig;
