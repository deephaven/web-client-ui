import {
  PluginType,
  isAuthPlugin,
  isDashboardPlugin,
  isTablePlugin,
  isThemePlugin,
} from './PluginTypes';

const pluginTypeToTypeGuardMap = [
  [PluginType.DASHBOARD_PLUGIN, isDashboardPlugin],
  [PluginType.AUTH_PLUGIN, isAuthPlugin],
  [PluginType.TABLE_PLUGIN, isTablePlugin],
  [PluginType.THEME_PLUGIN, isThemePlugin],
] as const;

describe.each(pluginTypeToTypeGuardMap)(
  'plugin type guard: %s',
  (expectedPluginType, typeGuard) => {
    it.each(pluginTypeToTypeGuardMap)(
      'should return true for expected plugin type: %s',
      givenPluginType => {
        expect(typeGuard({ name: 'test', type: givenPluginType })).toBe(
          givenPluginType === expectedPluginType
        );
      }
    );
  }
);
