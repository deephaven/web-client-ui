import { useContextOrThrow } from '@deephaven/react-hooks';
import { type PluginModuleMap, PluginsContext } from './PluginsContext';

export function usePlugins(): PluginModuleMap {
  return useContextOrThrow(
    PluginsContext,
    'No Plugins available in usePlugins. This can happen when plugins have not finished loading or if code is not wrapped in PluginsContext.Provider.'
  );
}

export default usePlugins;
