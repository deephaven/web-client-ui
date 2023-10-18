import type { BaseThemeType } from '@deephaven/components';
import type { TablePluginComponent } from './TablePlugin';

export const PluginType = Object.freeze({
  AUTH_PLUGIN: 'AuthPlugin',
  DASHBOARD_PLUGIN: 'DashboardPlugin',
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
  name: string;
  type: (typeof PluginType)[keyof typeof PluginType];
}

/**
 * A plugin that will be mounted to the dashboard.
 */
export interface DashboardPlugin extends Plugin {
  type: typeof PluginType.DASHBOARD_PLUGIN;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

export function isDashboardPlugin(
  plugin: PluginModule
): plugin is DashboardPlugin {
  return 'type' in plugin && plugin.type === PluginType.DASHBOARD_PLUGIN;
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
