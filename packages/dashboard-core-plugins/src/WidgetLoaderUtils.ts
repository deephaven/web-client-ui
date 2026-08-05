import Log from '@deephaven/log';
import {
  isWidgetPlugin,
  isWidgetMiddlewarePlugin,
  type PluginModuleMap,
  type WidgetPlugin,
  type WidgetMiddlewarePlugin,
} from '@deephaven/plugin';

const log = Log.module('WidgetLoaderUtils');

/**
 * Information about a widget type including its base plugin and any middleware.
 */
export interface WidgetTypeInfo {
  /** The base plugin that handles this widget type, or null if only middleware registered so far */
  basePlugin: WidgetPlugin | null;
  /** Middleware plugins to apply, in order from outermost to innermost */
  middleware: WidgetMiddlewarePlugin[];
}

/**
 * Widget type info that is guaranteed to have a base plugin.
 */
export type ValidWidgetTypeInfo = WidgetTypeInfo & {
  basePlugin: WidgetPlugin;
};

/**
 * Build a map of widget types to their plugin chain info.
 * For each type, we have a base plugin and a list of middleware to apply.
 *
 * Types that only have middleware registered (no base plugin) are omitted.
 *
 * @param plugins Map of all registered plugin modules
 * @returns Map of widget type to the base plugin and middleware for that type
 */
export function getSupportedWidgetTypes(
  plugins: PluginModuleMap
): Map<string, ValidWidgetTypeInfo> {
  const typeMap = new Map<string, WidgetTypeInfo>();

  plugins.forEach(plugin => {
    const isMiddleware = isWidgetMiddlewarePlugin(plugin);
    if (!isWidgetPlugin(plugin) && !isMiddleware) {
      return;
    }

    [plugin.supportedTypes].flat().forEach(supportedType => {
      if (supportedType == null || supportedType === '') {
        return;
      }

      const existing = typeMap.get(supportedType);

      if (isMiddleware) {
        // Add middleware to existing chain or create pending chain
        if (existing != null) {
          existing.middleware.push(plugin);
          log.debug(
            `Adding middleware ${plugin.name} to chain for type ${supportedType}`
          );
        } else {
          // No base plugin yet, create entry with just middleware
          // The base plugin will be set when a non-middleware plugin is registered
          typeMap.set(supportedType, {
            basePlugin: null,
            middleware: [plugin],
          });
          log.debug(
            `Creating pending middleware chain for type ${supportedType} with ${plugin.name}`
          );
        }
      } else {
        // Non-middleware plugin: becomes the base plugin
        if (existing != null) {
          if (existing.basePlugin != null) {
            // Already have a base plugin, warn about replacement
            log.warn(
              `Multiple WidgetPlugins handling type ${supportedType}. ` +
                `Replacing ${existing.basePlugin.name} with ${plugin.name} as base plugin`
            );
          }
          // Keep existing middleware, update the base plugin
          existing.basePlugin = plugin;
        } else {
          typeMap.set(supportedType, {
            basePlugin: plugin,
            middleware: [],
          });
        }
        log.debug(`Set base plugin ${plugin.name} for type ${supportedType}`);
      }
    });
  });

  // Filter out entries that only have middleware (no base plugin)
  const validEntries = new Map<string, ValidWidgetTypeInfo>();
  typeMap.forEach((info, type) => {
    if (info.basePlugin != null) {
      validEntries.set(type, info as ValidWidgetTypeInfo);
    } else {
      log.warn(
        `No base plugin found for type ${type}, middleware will not be applied`
      );
    }
  });

  return validEntries;
}

/**
 * Get the unique base plugins from a supported types map, merging the middleware
 * from each type a given base plugin handles.
 *
 * @param supportedTypes Map of widget type to base plugin and middleware
 * @returns Map of base plugin name to the base plugin and its merged middleware
 */
export function getUniqueWidgetPluginInfos(
  supportedTypes: Map<string, ValidWidgetTypeInfo>
): Map<string, ValidWidgetTypeInfo> {
  const uniquePluginInfos = new Map<string, ValidWidgetTypeInfo>();

  supportedTypes.forEach(info => {
    const existingInfo = uniquePluginInfos.get(info.basePlugin.name);
    if (existingInfo == null) {
      // Clone so the source map is not mutated
      uniquePluginInfos.set(info.basePlugin.name, {
        basePlugin: info.basePlugin,
        middleware: [...info.middleware],
      });
      return;
    }

    // Merge middleware from multiple type registrations for the same base plugin
    info.middleware.forEach(m => {
      if (!existingInfo.middleware.includes(m)) {
        existingInfo.middleware.push(m);
      }
    });
  });

  return uniquePluginInfos;
}
