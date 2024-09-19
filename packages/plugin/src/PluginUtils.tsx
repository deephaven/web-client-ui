import { isValidElement } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getThemeKey, type ThemeData } from '@deephaven/components';
import { vsPreview } from '@deephaven/icons';
import Log from '@deephaven/log';
import {
  type PluginModule,
  isWidgetPlugin,
  type PluginModuleMap,
  type ThemePlugin,
  isThemePlugin,
} from './PluginTypes';

const log = Log.module('@deephaven/plugin.PluginUtils');

export function pluginSupportsType(
  plugin: PluginModule | undefined,
  type: string
): boolean {
  if (plugin == null || !isWidgetPlugin(plugin)) {
    return false;
  }

  return [plugin.supportedTypes].flat().some(t => t === type);
}

export function getIconForPlugin(plugin: PluginModule): React.ReactElement {
  const defaultIcon = <FontAwesomeIcon icon={vsPreview} />;
  if (!isWidgetPlugin(plugin)) {
    return defaultIcon;
  }

  const { icon } = plugin;

  if (icon == null) {
    return defaultIcon;
  }

  if (isValidElement(icon)) {
    return icon;
  }

  return <FontAwesomeIcon icon={icon} />;
}

/**
 * Extract theme data from theme plugins in the given plugin map.
 * @param pluginMap
 */
export function getThemeDataFromPlugins(
  pluginMap: PluginModuleMap
): ThemeData[] {
  const themePluginEntries = [...pluginMap.entries()].filter(
    (entry): entry is [string, ThemePlugin] => isThemePlugin(entry[1])
  );

  log.debug('Getting theme data from plugins', themePluginEntries);

  return themePluginEntries
    .map(([pluginName, plugin]) => {
      // Normalize to an array since config can be an array of configs or a
      // single config
      const configs = Array.isArray(plugin.themes)
        ? plugin.themes
        : [plugin.themes];

      return configs.map(
        ({ name, baseTheme, styleContent }) =>
          ({
            baseThemeKey: `default-${baseTheme ?? 'dark'}`,
            themeKey: getThemeKey(pluginName, name),
            name,
            styleContent,
          }) as const
      );
    })
    .flat();
}
