import { isValidElement } from 'react';
import { vsPreview } from '@deephaven/icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  type PluginModule,
  isDashboardPlugin,
  SupportedType,
} from './PluginTypes';

function normalizeSupportedTypes(
  supportedTypes:
    | (SupportedType | string)
    | (SupportedType | string)[]
    | undefined
): SupportedType[] {
  if (supportedTypes == null) {
    return [];
  }

  if (typeof supportedTypes === 'string') {
    return [{ type: supportedTypes }];
  }

  if (!Array.isArray(supportedTypes)) {
    return [supportedTypes];
  }

  return supportedTypes.map(supportedType => {
    if (typeof supportedType === 'string') {
      return { type: supportedType };
    }
    return supportedType;
  });
}

export function pluginSupportsType(
  plugin: PluginModule | undefined,
  type: string
): boolean {
  if (plugin == null || !isDashboardPlugin(plugin)) {
    return false;
  }

  const supportedTypes = normalizeSupportedTypes(plugin.supportedTypes);
  return supportedTypes.some(supportedType => supportedType.type === type);
}

export function getIconForType(
  plugin: PluginModule | undefined,
  type: string
): React.ReactElement {
  const defaultIcon = <FontAwesomeIcon icon={vsPreview} />;
  if (plugin == null || !isDashboardPlugin(plugin)) {
    return defaultIcon;
  }

  const supportedTypes = normalizeSupportedTypes(plugin.supportedTypes);
  const supportedType = supportedTypes.find(p => p.type === type);

  if (supportedType == null || supportedType.icon == null) {
    return defaultIcon;
  }

  if (isValidElement(supportedType.icon)) {
    return supportedType.icon;
  }

  return <FontAwesomeIcon icon={supportedType.icon} />;
}
