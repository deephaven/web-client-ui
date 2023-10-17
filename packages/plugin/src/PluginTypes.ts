import type { BaseThemeType } from '@deephaven/components';
import { type JsWidget } from '@deephaven/jsapi-types';
import {
  type EventEmitter,
  type ItemContainer,
} from '@deephaven/golden-layout';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import type { TablePluginComponent } from './TablePlugin';

export const PluginType = Object.freeze({
  AUTH_PLUGIN: 'AuthPlugin',
  DASHBOARD_PLUGIN: 'DashboardPlugin',
  WIDGET_PLUGIN: 'WidgetPlugin',
  TABLE_PLUGIN: 'TablePlugin',
  THEME_PLUGIN: 'ThemePlugin',
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

export interface WidgetComponentProps {
  fetch: () => Promise<JsWidget>;
  metadata?: {
    id?: string;
    name?: string;
    type?: string;
  };
  localDashboardId: string;
  glContainer: ItemContainer;
  glEventHub: EventEmitter;
}

export interface WidgetPlugin extends Plugin {
  type: typeof PluginType.WIDGET_PLUGIN;
  /**
   * The component that can render the widget types the plugin supports.
   *
   * If the widget should be opened as a panel by itself (determined by the UI),
   * then `panelComponent` will be used instead.
   * The component will be wrapped in a default panel if `panelComponent` is not provided.
   */
  component: React.ComponentType<WidgetComponentProps>;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  panelComponent?: React.ComponentType<WidgetComponentProps>;

  /**
   * The icon to display next to the console button.
   * If a react node is provided (including a string), it will be rendered directly.
   * If no icon is specified, the default widget icon will be used.
   */
  icon?: IconDefinition | React.ReactElement;
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
  isAvailable(authHandlers: string[], authConfig: AuthConfigMap): boolean;
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
