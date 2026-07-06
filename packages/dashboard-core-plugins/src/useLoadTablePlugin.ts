import { useCallback, useContext } from 'react';
import {
  type TablePluginComponent,
  isTablePlugin,
  isLegacyTablePlugin,
  usePlugins,
} from '@deephaven/plugin';
import Log from '@deephaven/log';
import { TablePluginLoaderContext } from './TablePluginLoaderContext';

const log = Log.module('@deephaven/app-utils/useTablePlugin');

/**
 * Creates a table plugin loader function.
 * @returns A function to load a Table plugin element by name
 */
export function useLoadTablePlugin(): (name: string) => TablePluginComponent {
  const plugins = usePlugins();
  const loaderFromContext = useContext(TablePluginLoaderContext);

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

      // Fall back to the loader function provided via context, if any.
      if (loaderFromContext != null) {
        return loaderFromContext(name);
      }

      const errorMessage = `Unable to find table plugin ${name}.`;
      log.error(errorMessage);
      throw new Error(errorMessage);
    },
    [plugins, loaderFromContext]
  );

  return plugin;
}

export default useLoadTablePlugin;
