import { useCallback } from 'react';
import {
  type TablePluginComponent,
  isTablePlugin,
  isLegacyTablePlugin,
  usePlugins,
} from '@deephaven/plugin';
import Log from '@deephaven/log';

const log = Log.module('@deephaven/app-utils/useTablePlugin');

/**
 * Creates a table plugin loader function.
 * @returns A function to load a Table plugin element by name
 */
export function useLoadTablePlugin(): (name: string) => TablePluginComponent {
  const plugins = usePlugins();

  const plugin = useCallback(
    (name: string) => {
      // First check if we have any plugin modules loaded that match the TablePlugin.
      const pluginModule = plugins.get(name);
      if (pluginModule != null) {
        if (isTablePlugin(pluginModule)) {
          return pluginModule.component;
        }
        if (isLegacyTablePlugin(pluginModule)) {
          return pluginModule.TablePlugin;
        }
      }

      const errorMessage = `Unable to find table plugin ${name}.`;
      log.error(errorMessage);
      throw new Error(errorMessage);
    },
    [plugins]
  );

  return plugin;
}

export default useLoadTablePlugin;
