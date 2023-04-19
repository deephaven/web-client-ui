import { useContext } from 'react';
import { PluginsContext } from './PluginsBootstrap';

export const usePlugins = () => {
  const plugins = useContext(PluginsContext);
  if (plugins == null) {
    throw new Error(
      'No Plugins available in usePlugins. Was code wrapped in PluginsBootstrap or PluginsContext.Provider?'
    );
  }
  return plugins;
};

export default usePlugins;
