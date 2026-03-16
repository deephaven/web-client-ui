import type { BaseThemeType } from '@deephaven/components';
import {
  type EventEmitter,
  type ItemContainer,
} from '@deephaven/golden-layout';
import type { dh } from '@deephaven/jsapi-types';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import type { TablePluginComponent } from './TablePlugin';

export const PluginType = Object.freeze({
  AUTH_PLUGIN: 'AuthPlugin',
  DASHBOARD_PLUGIN: 'DashboardPlugin',
  ELEMENT_PLUGIN: 'ElementPlugin',
  MULTI_PLUGIN: 'MultiPlugin',
  TABLE_PLUGIN: 'TablePlugin',
  THEME_PLUGIN: 'ThemePlugin',
  WIDGET_PLUGIN: 'WidgetPlugin',
});

/**
 * @deprecated Use DashboardPlugin instead
 */
export type LegacyDashboardPlugin = { DashboardPlugin: React.ComponentType };

export function isLegacyDashboardPlugin(
  plugin: PluginModuleExport
): plugin is LegacyDashboardPlugin {
  return 'DashboardPlugin' in plugin;
}

/**
 * @deprecated Use AuthPlugin instead
 */
export type LegacyAuthPlugin = {
  AuthPlugin: {
    Component: React.ComponentType<AuthPluginProps>;
    isAvailable: (authHandlers: string[], authConfig: AuthConfigMap) => boolean;
  };
};

export function isLegacyAuthPlugin(
  plugin: PluginModuleExport
): plugin is LegacyAuthPlugin {
  return 'AuthPlugin' in plugin;
}

export type PluginModuleMap = Map<string, VersionedPluginModuleExport>;

/**
 * @deprecated Use TablePlugin instead
 */
export type LegacyTablePlugin = {
  TablePlugin: TablePluginComponent;
};

export function isLegacyTablePlugin(
  plugin: PluginModuleExport
): plugin is LegacyTablePlugin {
  return 'TablePlugin' in plugin;
}

/**
 * @deprecated Use Plugin instead
 */
export type LegacyPlugin =
  | LegacyDashboardPlugin
  | LegacyAuthPlugin
  | LegacyTablePlugin;

export function isLegacyPlugin(plugin: unknown): plugin is LegacyPlugin {
  return (
    isLegacyDashboardPlugin(plugin as PluginModuleExport) ||
    isLegacyAuthPlugin(plugin as PluginModuleExport) ||
    isLegacyTablePlugin(plugin as PluginModuleExport)
  );
}

export type PluginModuleExport = Plugin | LegacyPlugin;

/** @deprecated Use PluginModuleExport instead */
export type PluginModule = PluginModuleExport;

export type VersionedPluginModuleExport = PluginModuleExport & {
  version?: string;
};

/** @deprecated Use VersionedPluginModuleExport instead */
export type VersionedPluginModule = VersionedPluginModuleExport;

export interface Plugin {
  /**
   * The name of the plugin. This will be used as an identifier for the plugin and should be unique.
   */
  name: string;

  /**
   * The type of plugin.
   */
  type: (typeof PluginType)[keyof typeof PluginType];
}

/**
 * A plugin that will be mounted to the dashboard.
 */
export interface DashboardPlugin extends Plugin {
  type: typeof PluginType.DASHBOARD_PLUGIN;
  /**
   * The component to mount for the dashboard plugin.
   * This component is used to initialize the plugin and will only be mounted to the dashboard once.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

export function isDashboardPlugin(
  plugin: PluginModuleExport
): plugin is DashboardPlugin {
  return 'type' in plugin && plugin.type === PluginType.DASHBOARD_PLUGIN;
}

export interface WidgetComponentProps<T = unknown> {
  /**
   * Function to fetch the widget data.
   * @returns A promise that resolves to the widget data.
   */
  fetch: () => Promise<T>;
  /**
   * A unique identifier for the widget.
   * dh.ui uses this to identify widgets within a dashboard or panel.
   */
  __dhId?: string;
}

export interface WidgetPanelProps<T = unknown> extends WidgetComponentProps<T> {
  metadata?: dh.ide.VariableDescriptor;
  localDashboardId: string;
  glContainer: ItemContainer;
  glEventHub: EventEmitter;
}

export interface WidgetPlugin<T = unknown> extends Plugin {
  type: typeof PluginType.WIDGET_PLUGIN;
  /**
   * The component that can render the widget types the plugin supports.
   *
   * If the widget should be opened as a panel by itself (determined by the UI),
   * then `panelComponent` will be used instead.
   * The component will be wrapped in a default panel if `panelComponent` is not provided.
   */
  component: React.ComponentType<WidgetComponentProps<T>>;

  /**
   * The server widget types that this plugin will handle.
   */
  supportedTypes: string | string[];

  /**
   * The title to display for widgets handled by the plugin.
   * This is a user friendly name to denote the type of widget.
   * Does not have to be unique across plugins.
   * If not specified, the plugin name will be used as the title.
   *
   * A plugin may have a name of `@deehaven/pandas` and a title of `Pandas`.
   * This way, the user will just see `Pandas panel` instead of `@deephaven/pandas panel`.
   */
  title?: string;

  /**
   * The component to use if the widget should be mounted as a panel.
   * If omitted, the default panel will be used.
   * This provides access to panel events such as onHide and onTabFocus.
   *
   * See @deephaven/dashboard-core-plugins WidgetPanel for the component that should be used here.
   */
  panelComponent?: React.ComponentType<WidgetPanelProps<T>>;

  /**
   * The icon to display next to the console button.
   * If a react node is provided (including a string), it will be rendered directly.
   * If no icon is specified, the default widget icon will be used.
   */
  icon?: IconDefinition | React.ReactElement<unknown>;
}

export function isWidgetPlugin(
  plugin: PluginModuleExport
): plugin is WidgetPlugin {
  return 'type' in plugin && plugin.type === PluginType.WIDGET_PLUGIN;
}

export interface TablePlugin extends Plugin {
  type: typeof PluginType.TABLE_PLUGIN;
  component: TablePluginComponent;
}

export function isTablePlugin(
  plugin: PluginModuleExport
): plugin is TablePlugin {
  return 'type' in plugin && plugin.type === PluginType.TABLE_PLUGIN;
}

/**
 * Map from auth config keys to their values
 * E.g. Map { AuthHandlers → "io.deephaven.auth.AnonymousAuthenticationHandler" }
 */
export type AuthConfigMap = Map<string, string>;

/**
 * Props for the auth plugin component to render
 */
export type AuthPluginProps = {
  /** Map from config keys to their values */
  authConfigValues: AuthConfigMap;

  /**
   * The children to render after authentication is completed.
   */
  children: React.ReactNode;
};

export type AuthPluginComponent = React.ComponentType<AuthPluginProps>;

export interface AuthPlugin extends Plugin {
  type: typeof PluginType.AUTH_PLUGIN;
  /**
   * The component to mount if the AuthPlugin is available
   */
  component: AuthPluginComponent;
  /**
   * Whether the auth plugin is available given the current configuration
   */
  isAvailable: (authHandlers: string[], authConfig: AuthConfigMap) => boolean;
}

export function isAuthPlugin(plugin: PluginModuleExport): plugin is AuthPlugin {
  return 'type' in plugin && plugin.type === PluginType.AUTH_PLUGIN;
}

export interface ThemeConfig {
  name: string;
  baseTheme?: BaseThemeType;
  styleContent: string;
}

export interface ThemePlugin extends Plugin {
  type: typeof PluginType.THEME_PLUGIN;
  themes: ThemeConfig | ThemeConfig[];
}

/** Type guard to check if given plugin is a `ThemePlugin` */
export function isThemePlugin(
  plugin: PluginModuleExport
): plugin is ThemePlugin {
  return 'type' in plugin && plugin.type === PluginType.THEME_PLUGIN;
}

export type ElementName = string;

/** A mapping of element names to their React components. */
export type ElementPluginMappingDefinition<
  P extends Record<ElementName, unknown> = Record<string, never>,
> = {
  [K in keyof P]: React.ComponentType<P[K]>;
};

export type ElementMap<
  P extends Record<string, unknown> = Record<string, never>,
> = ReadonlyMap<
  keyof P extends never ? string : keyof P,
  React.ComponentType<P[keyof P]>
>;

/** An element plugin is used by deephaven.ui to render custom components
 * The mapping contains the element names as keys and the React components as values.
 */
export interface ElementPlugin extends Plugin {
  type: typeof PluginType.ELEMENT_PLUGIN;
  mapping: ElementPluginMappingDefinition;
}

export function isElementPlugin(
  plugin: PluginModuleExport
): plugin is ElementPlugin {
  return 'type' in plugin && plugin.type === PluginType.ELEMENT_PLUGIN;
}

/**
 * A plugin that contains multiple plugins.
 * When loaded, each plugin in the `plugins` array will be registered individually.
 */
export interface MultiPlugin extends Plugin {
  type: typeof PluginType.MULTI_PLUGIN;
  /**
   * The plugins to register. Each plugin will be registered by its own name.
   * Note: Nested MultiPlugins are not supported.
   */
  plugins: Plugin[];
}

/** Type guard to check if given plugin is a `MultiPlugin` */
export function isMultiPlugin(
  plugin: PluginModuleExport
): plugin is MultiPlugin {
  return 'type' in plugin && plugin.type === PluginType.MULTI_PLUGIN;
}

export function isPlugin(plugin: unknown): plugin is Plugin {
  return (
    isDashboardPlugin(plugin as PluginModuleExport) ||
    isAuthPlugin(plugin as PluginModuleExport) ||
    isElementPlugin(plugin as PluginModuleExport) ||
    isMultiPlugin(plugin as PluginModuleExport) ||
    isTablePlugin(plugin as PluginModuleExport) ||
    isThemePlugin(plugin as PluginModuleExport) ||
    isWidgetPlugin(plugin as PluginModuleExport)
  );
}
