import { PluginType, WidgetPlugin } from '@deephaven/plugin';
import { dhPandas } from '@deephaven/icons';
import { PandasWidgetPlugin } from './PandasWidgetPlugin';
import { PandasPanelPlugin } from './PandasPanelPlugin';

const PandasPluginConfig: WidgetPlugin = {
  name: 'PandasPanel',
  title: 'Pandas',
  type: PluginType.WIDGET_PLUGIN,
  component: PandasWidgetPlugin,
  panelComponent: PandasPanelPlugin,
  supportedTypes: 'pandas.DataFrame',
  icon: dhPandas,
};

export default PandasPluginConfig;
