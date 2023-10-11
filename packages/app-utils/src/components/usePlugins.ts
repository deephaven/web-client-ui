import { useContextOrThrow } from '@deephaven/react-hooks';
import type { PluginModuleMap } from '../plugins';
import { PluginsContext } from './PluginsBootstrap';

export function usePlugins(): PluginModuleMap {
  return useContextOrThrow(
    PluginsContext,
    'No Plugins available in usePlugins. This can happen when plugins have not finished loading or if code is not wrapped in PluginsBootstrap or PluginsContext.Provider.'
  );
}

export default usePlugins;
