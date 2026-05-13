import type { BaseThemeType } from '@deephaven/components';
import type {
  CreateDashboardPayload,
  WidgetDescriptor,
} from '@deephaven/dashboard';
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
  MIDDLEWARE_PLUGIN: 'MiddlewarePlugin',
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
   * Descriptor of the widget, which may contain information such as the type and name of the widget.
   */
  metadata?: WidgetDescriptor;
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
 *
 * A middleware plugin uses its own `PluginType.MIDDLEWARE_PLUGIN` discriminator
 * (rather than being a flagged `WidgetPlugin`) so consumers can cleanly
 * distinguish base widget plugins from middleware via type narrowing.
 */
export interface WidgetMiddlewarePlugin<T = unknown> extends Plugin {
  type: typeof PluginType.MIDDLEWARE_PLUGIN;

  /**
   * The middleware component that wraps the base widget component.
   * Receives the wrapped component as a prop and should render it.
   */
  component: React.ComponentType<WidgetMiddlewareComponentProps<T>>;

  /**
   * The server widget types that this middleware applies to.
   * Matches the same `supportedTypes` semantics as `WidgetPlugin`.
   */
  supportedTypes: string | string[];

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
  plugin: PluginModuleExport
): plugin is WidgetMiddlewarePlugin {
  return 'type' in plugin && plugin.type === PluginType.MIDDLEWARE_PLUGIN;
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

/**
 * Special type of WidgetPlugin that supports opening a widget as a dashboard instead of a panel.
 */
export interface WidgetDashboardPlugin<T = unknown> extends WidgetPlugin<T> {
  /**
   * The widget dashboard types that this plugin can handle.
   * Widgets of these types can be opened by this plugin as a dashboard using the `createDashboardPayload` function.
   * Can overlap with `supportedTypes` for widgets that can be opened as either a panel or a dashboard (e.g. nested dashboards).
   */
  dashboardTypes: string | string[];

  /**
   * A function to generate the dashboard payload for creating a new dashboard when a widget of widget is opened.
   * @param widget Widget to get the create dashboard payload for
   * @returns The dashboard payload for creating a new dashboard
   */
  createDashboardPayload<D extends WidgetDescriptor>(
    widget: D
  ): CreateDashboardPayload;
}

export function isWidgetPlugin(
  plugin: PluginModuleExport
): plugin is WidgetPlugin {
  return 'type' in plugin && plugin.type === PluginType.WIDGET_PLUGIN;
}

export function isWidgetDashboardPlugin(
  plugin: PluginModuleExport
): plugin is WidgetDashboardPlugin {
  return (
    isWidgetPlugin(plugin) &&
    'dashboardTypes' in plugin &&
    plugin.dashboardTypes != null
  );
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
    isWidgetPlugin(plugin as PluginModuleExport) ||
    isWidgetMiddlewarePlugin(plugin as PluginModuleExport)
  );
}
