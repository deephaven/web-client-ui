import React, { isValidElement } from 'react';
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
  isElementPlugin,
  type ElementPlugin,
  type ElementMap,
  type WidgetMiddlewarePlugin,
  type WidgetComponentProps,
  type WidgetPanelProps,
  type WidgetMiddlewarePanelProps,
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

/**
 * Get a mapping of element names to their React components from the given plugin map.
 * @param pluginMap The plugin map to extract element plugins from.
 * @returns A Map of element names to their React components.
 */
export function getPluginsElementMap(pluginMap: PluginModuleMap): ElementMap {
  const elementPluginEntries = [...pluginMap.entries()].filter(
    (entry): entry is [string, ElementPlugin] =>
      isElementPlugin(entry[1]) && entry[1].mapping != null
  );

  log.debug('Getting element plugin mapping', elementPluginEntries);

  return new Map(
    elementPluginEntries.flatMap(([, plugin]) => Object.entries(plugin.mapping))
  );
}

/**
 * Creates a component that chains middleware around a base component.
 * Each middleware wraps the next, with the base component at the innermost layer.
 */
export function createChainedComponent<T>(
  baseComponent: React.ComponentType<WidgetComponentProps<T>>,
  middleware: WidgetMiddlewarePlugin<T>[]
): React.ComponentType<WidgetComponentProps<T>> {
  if (middleware.length === 0) {
    return baseComponent;
  }

  // Build the chain from inside out (base component is innermost)
  // Middleware is ordered outermost to innermost, so we reverse to build from inside out
  return [...middleware]
    .reverse()
    .reduce<React.ComponentType<WidgetComponentProps<T>>>(
      (WrappedComponent, middlewarePlugin) => {
        const MiddlewareComponent = middlewarePlugin.component;

        function ChainedComponent(props: WidgetComponentProps<T>) {
          return (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <MiddlewareComponent {...props} Component={WrappedComponent} />
          );
        }
        ChainedComponent.displayName = `${middlewarePlugin.name}(${
          (WrappedComponent as React.ComponentType).displayName ??
          (WrappedComponent as React.ComponentType).name ??
          'Component'
        })`;
        return ChainedComponent;
      },
      baseComponent
    );
}

/**
 * Creates a panel component that chains middleware around a base panel component.
 * Each middleware panel wraps the next, with the base panel at the innermost layer.
 */
export function createChainedPanelComponent<T>(
  basePanelComponent: React.ComponentType<WidgetPanelProps<T>>,
  middleware: WidgetMiddlewarePlugin<T>[]
): React.ComponentType<WidgetPanelProps<T>> {
  // Filter to middleware that has a panelComponent and extract just the panel components
  type MiddlewareWithPanel = WidgetMiddlewarePlugin<T> & {
    panelComponent: React.ComponentType<WidgetMiddlewarePanelProps<T>>;
  };
  const panelMiddleware = middleware.filter(
    (m): m is MiddlewareWithPanel => m.panelComponent != null
  );

  if (panelMiddleware.length === 0) {
    return basePanelComponent;
  }

  // Build the chain from inside out (base panel is innermost)
  return [...panelMiddleware]
    .reverse()
    .reduce<React.ComponentType<WidgetPanelProps<T>>>(
      (WrappedPanel, middlewarePlugin) => {
        const { panelComponent: MiddlewarePanelComponent } = middlewarePlugin;

        function ChainedPanel(props: WidgetPanelProps<T>) {
          return (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <MiddlewarePanelComponent {...props} Component={WrappedPanel} />
          );
        }
        ChainedPanel.displayName = `${middlewarePlugin.name}Panel(${
          (WrappedPanel as React.ComponentType).displayName ??
          (WrappedPanel as React.ComponentType).name ??
          'Panel'
        })`;
        return ChainedPanel;
      },
      basePanelComponent
    );
}
