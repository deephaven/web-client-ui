import { isValidElement } from 'react';
import { vsPreview } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type PluginModule, isElementPlugin } from './PluginTypes';

export function pluginSupportsType(
  plugin: PluginModule | undefined,
  type: string
): boolean {
  if (plugin == null || !isElementPlugin(plugin)) {
    return false;
  }

  return [plugin.supportedTypes].flat().some(t => t === type);
}

export function getIconForType(
  plugin: PluginModule | undefined,
  type: string
): React.ReactElement {
  const defaultIcon = <FontAwesomeIcon icon={vsPreview} />;
  if (plugin == null || !isElementPlugin(plugin)) {
    return defaultIcon;
  }

  const supportsType = pluginSupportsType(plugin, type);
  const { icon } = plugin;

  if (!supportsType || icon == null) {
    return defaultIcon;
  }

  if (isValidElement(icon)) {
    return icon;
  }

  return <FontAwesomeIcon icon={icon} />;
}
