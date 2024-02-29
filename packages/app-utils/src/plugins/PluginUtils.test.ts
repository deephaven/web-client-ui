import { LegacyPlugin, Plugin, PluginType } from '@deephaven/plugin';
import { getPluginModuleValue } from './PluginUtils';

describe('getPluginModuleValue', () => {
  const legacyPlugins: [type: string, moduleValue: LegacyPlugin][] = [
    [
      'dashboard',
      {
        DashboardPlugin: () => null,
      },
    ],
    [
      'auth',
      {
        AuthPlugin: {
          Component: () => null,
          isAvailable: () => true,
        },
      },
    ],
    [
      'table',
      {
        TablePlugin: () => null,
      },
    ],
  ];

  const newPlugins: [type: string, moduleValue: Plugin][] = Object.keys(
    PluginType
  ).map(type => [type, { name: `${type}`, type: PluginType[type] }]);

  const newPluginsWithNamedExports: [
    type: string,
    moduleValue: { default: Plugin; [key: string]: unknown },
  ][] = Object.keys(PluginType).map(type => [
    type,
    {
      default: { name: `${type}Plugin`, type: PluginType[type] },
      NamedExport: 'NamedExportValue',
    },
  ]);

  const combinedPlugins: [
    type: string,
    moduleValue: {
      default: Plugin;
    } & LegacyPlugin,
  ][] = [
    [
      'dashboard',
      {
        default: {
          name: 'combinedFormat1',
          type: PluginType.DASHBOARD_PLUGIN,
        },
        DashboardPlugin: () => null,
      },
    ],
    [
      'auth',
      {
        default: {
          name: 'combinedFormat2',
          type: PluginType.AUTH_PLUGIN,
        },
        AuthPlugin: {
          Component: () => null,
          isAvailable: () => true,
        },
      },
    ],
    [
      'table',
      {
        default: {
          name: 'combinedFormat3',
          type: PluginType.TABLE_PLUGIN,
        },
        TablePlugin: () => null,
      },
    ],
    [
      // Should be able to combine different plugin types
      'multiple',
      {
        default: {
          name: 'widgetPlugin',
          type: PluginType.WIDGET_PLUGIN,
        },
        DashboardPlugin: () => null,
      },
    ],
  ];

  it.each(legacyPlugins)(
    'supports legacy %s plugin format',
    (type, legacyPlugin) => {
      const moduleValue = getPluginModuleValue(legacyPlugin);
      expect(moduleValue).toBe(legacyPlugin);
    }
  );

  it.each(newPlugins)('supports new %s format', (type, plugin) => {
    const moduleValue = getPluginModuleValue(plugin);
    expect(moduleValue).toBe(plugin);
  });

  it.each(newPluginsWithNamedExports)(
    'supports new %s format with named exports',
    (type, plugin) => {
      const moduleValue = getPluginModuleValue(plugin);
      expect(moduleValue).toBe(plugin.default);
    }
  );

  it.each(combinedPlugins)(
    'prioritizes new %s plugin if the module contains both legacy and new format',
    (type, plugin) => {
      const moduleValue = getPluginModuleValue(plugin);
      expect(moduleValue).toBe(plugin.default);
    }
  );

  it('returns null if the module value is not a plugin', () => {
    const moduleValue = getPluginModuleValue({} as Plugin);
    expect(moduleValue).toBeNull();
  });
});
