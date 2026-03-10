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
  WIDGET_PLUGIN: 'WidgetPlugin',
  TABLE_PLUGIN: 'TablePlugin',
  THEME_PLUGIN: 'ThemePlugin',
  ELEMENT_PLUGIN: 'ElementPlugin',
});

/**
 * @deprecated Use DashboardPlugin instead
 */
export type LegacyDashboardPlugin = { DashboardPlugin: React.ComponentType };

export function isLegacyDashboardPlugin(
  plugin: PluginModule
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
  plugin: PluginModule
): plugin is LegacyAuthPlugin {
  return 'AuthPlugin' in plugin;
}

export type PluginModuleMap = Map<string, VersionedPluginModule>;

/**
 * @deprecated Use TablePlugin instead
 */
export type LegacyTablePlugin = {
  TablePlugin: TablePluginComponent;
};

export function isLegacyTablePlugin(
  plugin: PluginModule
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
    isLegacyDashboardPlugin(plugin as PluginModule) ||
    isLegacyAuthPlugin(plugin as PluginModule) ||
    isLegacyTablePlugin(plugin as PluginModule)
  );
}

export type PluginModule = Plugin | LegacyPlugin;

export type VersionedPluginModule = PluginModule & { version?: string };

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
  plugin: PluginModule
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

/**
 * Props passed to middleware components that wrap a base widget.
 * Extends WidgetComponentProps with the wrapped component.
 */
export interface WidgetMiddlewareComponentProps<T = unknown>
  extends WidgetComponentProps<T> {
  /**
   * The next component in the middleware chain.
   * Middleware should render this component to continue the chain.
   */
  Component: React.ComponentType<WidgetComponentProps<T>>;
}

/**
 * Props passed to middleware panel components that wrap a base panel.
 * Extends WidgetPanelProps with the wrapped panel component.
 */
export interface WidgetMiddlewarePanelProps<T = unknown>
  extends WidgetPanelProps<T> {
  /**
   * The next panel component in the middleware chain.
   * Middleware should render this component to continue the chain.
   */
  Component: React.ComponentType<WidgetPanelProps<T>>;
}

/**
 * A middleware plugin that can wrap and enhance another widget plugin.
 * Middleware plugins are chained together in registration order,
 * with each middleware wrapping the next in the chain.
 *
 * The middleware pattern allows plugins to:
 * - Add additional UI elements around a widget
 * - Intercept and modify props before they reach the wrapped component
 * - Provide additional context or state to the wrapped component
 * - Add menu items or other extensions to the widget
 */
export interface WidgetMiddlewarePlugin<T = unknown>
  extends Omit<WidgetPlugin<T>, 'component' | 'panelComponent'> {
  /**
   * Marks this plugin as middleware that should be chained
   * with other plugins of the same supportedTypes.
   */
  isMiddleware: true;

  /**
   * The middleware component that wraps the base widget component.
   * Receives the wrapped component as a prop and should render it.
   */
  component: React.ComponentType<WidgetMiddlewareComponentProps<T>>;

  /**
   * The middleware panel component that wraps the base panel component.
   * If omitted, only the component middleware will be applied.
   */
  panelComponent?: React.ComponentType<WidgetMiddlewarePanelProps<T>>;
}

/**
 * Type guard to check if a plugin is a middleware plugin.
 */
export function isWidgetMiddlewarePlugin(
  plugin: PluginModule
): plugin is WidgetMiddlewarePlugin {
  return (
    isWidgetPlugin(plugin) &&
    'isMiddleware' in plugin &&
    plugin.isMiddleware === true
  );
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

export function isWidgetPlugin(plugin: PluginModule): plugin is WidgetPlugin {
  return 'type' in plugin && plugin.type === PluginType.WIDGET_PLUGIN;
}

export interface TablePlugin extends Plugin {
  type: typeof PluginType.TABLE_PLUGIN;
  component: TablePluginComponent;
}

export function isTablePlugin(plugin: PluginModule): plugin is TablePlugin {
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

export function isAuthPlugin(plugin: PluginModule): plugin is AuthPlugin {
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
export function isThemePlugin(plugin: PluginModule): plugin is ThemePlugin {
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

export function isElementPlugin(plugin: PluginModule): plugin is ElementPlugin {
  return 'type' in plugin && plugin.type === PluginType.ELEMENT_PLUGIN;
}

export function isPlugin(plugin: unknown): plugin is Plugin {
  return (
    isDashboardPlugin(plugin as PluginModule) ||
    isAuthPlugin(plugin as PluginModule) ||
    isTablePlugin(plugin as PluginModule) ||
    isThemePlugin(plugin as PluginModule) ||
    isWidgetPlugin(plugin as PluginModule) ||
    isElementPlugin(plugin as PluginModule)
  );
}
