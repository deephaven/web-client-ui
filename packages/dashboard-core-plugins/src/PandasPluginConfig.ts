import { PluginType, WidgetPlugin } from '@deephaven/plugin';
import { dhPandas } from '@deephaven/icons';
import PandasPlugin from './PandasPlugin';

const PandasPluginConfig: WidgetPlugin = {
  name: 'PandasPanel',
  title: 'Pandas',
  type: PluginType.WIDGET_PLUGIN,
  // TODO: #1573 Replace with actual base component and not just the panel plugin
  component: PandasPlugin,
  panelComponent: PandasPlugin,
  supportedTypes: 'pandas.DataFrame',
  icon: dhPandas,
};

export default PandasPluginConfig;
