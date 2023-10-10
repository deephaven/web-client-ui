import { PluginType, ElementPlugin } from '@deephaven/plugin';
import { dhPandas } from '@deephaven/icons';
import PandasPlugin from './PandasPlugin';

const PandasPluginConfig: ElementPlugin = {
  name: 'PandasPlugin',
  type: PluginType.ELEMENT_PLUGIN,
  component: PandasPlugin,
  supportedTypes: 'pandas.DataFrame',
  icon: dhPandas,
};

export default PandasPluginConfig;
