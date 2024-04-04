import { PluginType, WidgetPlugin } from '@deephaven/plugin';
import { dhPandas } from '@deephaven/icons';
import type { dh } from '@deephaven/jsapi-types';
import { PandasWidgetPlugin } from './PandasWidgetPlugin';
import { PandasPanelPlugin } from './PandasPanelPlugin';

const PandasPluginConfig: WidgetPlugin<dh.Table> = {
  name: 'PandasPanel',
  title: 'Pandas',
  type: PluginType.WIDGET_PLUGIN,
  component: PandasWidgetPlugin,
  panelComponent: PandasPanelPlugin,
  supportedTypes: 'pandas.DataFrame',
  icon: dhPandas,
};

export default PandasPluginConfig;
