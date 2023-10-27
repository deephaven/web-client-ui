import { createContext } from 'react';
import { type PluginModule } from './PluginTypes';

export type PluginModuleMap = Map<string, PluginModule>;

export const PluginsContext = createContext<PluginModuleMap | null>(null);

export default PluginsContext;
