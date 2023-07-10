import { useContextOrThrow } from '@deephaven/react-hooks';
import { PluginsContext } from './PluginsBootstrap';

export function usePlugins() {
  return useContextOrThrow(
    PluginsContext,
    'No Plugins available in usePlugins. Was code wrapped in PluginsBootstrap or PluginsContext.Provider?'
  );
}

export default usePlugins;
