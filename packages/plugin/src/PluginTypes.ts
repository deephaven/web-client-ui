export const PluginType = Object.freeze({
  AUTH_PLUGIN: 'AuthPlugin',
  DASHBOARD_PLUGIN: 'DashboardPlugin',
  TABLE_PLUGIN: 'TablePlugin',
});

export type LegacyDashboardPlugin = { DashboardPlugin: React.ComponentType };

export type LegacyAuthPlugin = {
  Component: React.ComponentType<AuthPluginProps>;
  isAvailable: (authHandlers: string[], authConfig: AuthConfigMap) => boolean;
};

export type LegacyTablePlugin = {
  TablePlugin: React.ComponentType;
};

export type LegacyPlugin =
  | LegacyDashboardPlugin
  | LegacyAuthPlugin
  | LegacyTablePlugin;

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
  component: React.ComponentType;
}

export function isDashboardPlugin(
  plugin: PluginModule
): plugin is DashboardPlugin {
  return 'type' in plugin && plugin.type === PluginType.DASHBOARD_PLUGIN;
}

export interface TablePlugin extends Plugin {
  type: typeof PluginType.TABLE_PLUGIN;
  component: React.ComponentType;
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
