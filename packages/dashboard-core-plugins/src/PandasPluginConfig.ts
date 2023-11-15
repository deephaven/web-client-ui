import { PluginType, WidgetPlugin } from '@deephaven/plugin';
import { dhPandas } from '@deephaven/icons';
import { PandasPlugin, PandasPanelPlugin } from './PandasPlugin';

const PandasPluginConfig: WidgetPlugin = {
  name: 'PandasPanel',
  title: 'Pandas',
  type: PluginType.WIDGET_PLUGIN,
  component: PandasPlugin,
  panelComponent: PandasPanelPlugin,
  supportedTypes: 'pandas.DataFrame',
  icon: dhPandas,
};

export default PandasPluginConfig;
