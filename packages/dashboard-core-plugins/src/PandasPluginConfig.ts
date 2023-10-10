import { PluginType, WidgetPlugin } from '@deephaven/plugin';
import { dhPandas } from '@deephaven/icons';
import PandasPlugin from './PandasPlugin';

const PandasPluginConfig: WidgetPlugin = {
  name: 'PandasPlugin',
  type: PluginType.WIDGET_PLUGIN,
  component: PandasPlugin,
  supportedTypes: 'pandas.DataFrame',
  icon: dhPandas,
};

export default PandasPluginConfig;
