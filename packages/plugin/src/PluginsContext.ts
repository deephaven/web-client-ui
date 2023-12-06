import { createContext } from 'react';
import { type PluginModuleMap } from './PluginTypes';

export const PluginsContext = createContext<PluginModuleMap | null>(null);

export default PluginsContext;
