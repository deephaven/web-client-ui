import {
  type LegacyPlugin,
  type MultiPlugin,
  type Plugin,
  PluginType,
} from '@deephaven/plugin';
import { getPluginModuleValue, loadModulePlugins } from './PluginUtils';
import { resolve } from './remote-component.config';

jest.mock('./loadRemoteModule', () => {
  const mockLoadRemoteModule = jest.fn();
  return {
    __esModule: true,
    default: mockLoadRemoteModule,
    loadRemoteModule: mockLoadRemoteModule,
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
const { default: loadRemoteModule } = require('./loadRemoteModule') as {
  default: jest.Mock;
};

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

  describe('MultiPlugin', () => {
    const multiPlugin: MultiPlugin = {
      name: 'test-multi-plugin',
      type: PluginType.MULTI_PLUGIN,
      plugins: [
        { name: 'widget-plugin', type: PluginType.WIDGET_PLUGIN },
        { name: 'dashboard-plugin', type: PluginType.DASHBOARD_PLUGIN },
        { name: 'theme-plugin', type: PluginType.THEME_PLUGIN },
      ] as Plugin[],
    };

    it('supports MultiPlugin format', () => {
      const moduleValue = getPluginModuleValue(multiPlugin);
      expect(moduleValue).toBe(multiPlugin);
    });

    it('supports MultiPlugin with default export', () => {
      const moduleWithDefault = { default: multiPlugin };
      const moduleValue = getPluginModuleValue(moduleWithDefault);
      expect(moduleValue).toBe(multiPlugin);
    });

    it('supports MultiPlugin with named exports', () => {
      const moduleWithNamedExports = {
        default: multiPlugin,
        SomeNamedExport: 'value',
      };
      const moduleValue = getPluginModuleValue(moduleWithNamedExports);
      expect(moduleValue).toBe(multiPlugin);
    });
  });
});

describe('loadModulePlugins', () => {
  const BASE_URL = 'http://localhost:4100/plugins';

  function makePlugin(name: string): Plugin {
    return { name, type: PluginType.WIDGET_PLUGIN };
  }

  function mockManifest(
    plugins: { name: string; main: string; version: string }[]
  ) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ plugins }),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    // Clean up any plugin entries added to resolve in previous tests
    Object.keys(resolve).forEach(key => {
      if (
        key.startsWith('test-plugin') ||
        key.startsWith('@deephaven/js-plugin-test-plugin') ||
        key.startsWith('@acme/')
      ) {
        delete resolve[key];
      }
    });
  });

  it('loads plugins sequentially and registers them in the plugin map', async () => {
    const pluginA = makePlugin('test-plugin-a');
    const pluginB = makePlugin('test-plugin-b');

    mockManifest([
      { name: 'test-plugin-a', main: 'index.js', version: '1.0.0' },
      { name: 'test-plugin-b', main: 'index.js', version: '2.0.0' },
    ]);

    loadRemoteModule
      .mockResolvedValueOnce(pluginA)
      .mockResolvedValueOnce(pluginB);

    const pluginMap = await loadModulePlugins(BASE_URL);

    expect(pluginMap.size).toBe(2);
    expect(pluginMap.get('test-plugin-a')).toEqual({
      ...pluginA,
      version: '1.0.0',
    });
    expect(pluginMap.get('test-plugin-b')).toEqual({
      ...pluginB,
      version: '2.0.0',
    });
  });

  it('registers each plugin in the resolve map for plugin-to-plugin dependencies', async () => {
    const pluginA = makePlugin('test-plugin-a');
    const moduleExports = { default: pluginA, SomeHelper: 'helper-value' };

    mockManifest([
      {
        name: 'test-plugin-a',
        main: 'index.js',
        version: '1.0.0',
        package: '@deephaven/js-plugin-test-plugin-a',
      },
    ]);

    loadRemoteModule.mockResolvedValueOnce(moduleExports);

    await loadModulePlugins(BASE_URL);

    // The raw module exports (not the extracted PluginModule) should be in the resolve map
    expect(resolve['@deephaven/js-plugin-test-plugin-a']).toBe(moduleExports);
  });

  it('does not register plugin in resolve map when package field is absent', async () => {
    const pluginA = makePlugin('test-plugin-a');
    const moduleExports = { default: pluginA };

    mockManifest([
      { name: 'test-plugin-a', main: 'index.js', version: '1.0.0' },
    ]);

    loadRemoteModule.mockResolvedValueOnce(moduleExports);

    await loadModulePlugins(BASE_URL);

    // No package field → not registered in resolve map
    expect(resolve['@deephaven/js-plugin-test-plugin-a']).toBeUndefined();
    expect(resolve['test-plugin-a']).toBeUndefined();
  });

  it('makes earlier plugins available to later plugins via resolve map', async () => {
    const pluginA = makePlugin('test-plugin-a');
    const pluginB = makePlugin('test-plugin-b');

    mockManifest([
      {
        name: 'test-plugin-a',
        main: 'index.js',
        version: '1.0.0',
        package: '@deephaven/js-plugin-test-plugin-a',
      },
      {
        name: 'test-plugin-b',
        main: 'index.js',
        version: '1.0.0',
        package: '@deephaven/js-plugin-test-plugin-b',
      },
    ]);

    const moduleA = { default: pluginA, ExportedClass: class MyClass {} };

    // When plugin B loads, verify plugin A is already in the resolve map
    loadRemoteModule.mockResolvedValueOnce(moduleA).mockImplementationOnce(
      () =>
        new Promise(res => {
          // At this point, plugin A should already be registered
          expect(resolve['@deephaven/js-plugin-test-plugin-a']).toBe(moduleA);
          res(pluginB);
        })
    );

    await loadModulePlugins(BASE_URL);

    expect(resolve['@deephaven/js-plugin-test-plugin-a']).toBe(moduleA);
    expect(resolve['@deephaven/js-plugin-test-plugin-b']).toBe(pluginB);
  });

  it('continues loading remaining plugins when one fails', async () => {
    const pluginB = makePlugin('test-plugin-b');

    mockManifest([
      { name: 'test-plugin-a', main: 'index.js', version: '1.0.0' },
      { name: 'test-plugin-b', main: 'index.js', version: '1.0.0' },
    ]);

    loadRemoteModule
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(pluginB);

    const pluginMap = await loadModulePlugins(BASE_URL);

    expect(pluginMap.size).toBe(1);
    expect(pluginMap.has('test-plugin-a')).toBe(false);
    expect(pluginMap.get('test-plugin-b')).toEqual({
      ...pluginB,
      version: '1.0.0',
    });
  });

  it('does not register a failed plugin in the resolve map', async () => {
    mockManifest([
      {
        name: 'test-plugin-a',
        main: 'index.js',
        version: '1.0.0',
        package: '@deephaven/js-plugin-test-plugin-a',
      },
    ]);

    loadRemoteModule.mockRejectedValueOnce(new Error('Load failed'));

    await loadModulePlugins(BASE_URL);

    expect(resolve['@deephaven/js-plugin-test-plugin-a']).toBeUndefined();
  });

  it('returns empty map when manifest fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    });

    const pluginMap = await loadModulePlugins(BASE_URL);

    expect(pluginMap.size).toBe(0);
  });

  it('returns empty map when manifest has no plugins array', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const pluginMap = await loadModulePlugins(BASE_URL);

    expect(pluginMap.size).toBe(0);
  });

  it('flattens MultiPlugin and registers inner plugins', async () => {
    const multiPlugin: MultiPlugin = {
      name: 'test-plugin-multi',
      type: PluginType.MULTI_PLUGIN,
      plugins: [
        makePlugin('test-plugin-inner-1'),
        makePlugin('test-plugin-inner-2'),
      ] as Plugin[],
    };

    mockManifest([
      { name: 'test-plugin-multi', main: 'index.js', version: '1.0.0' },
    ]);

    loadRemoteModule.mockResolvedValueOnce(multiPlugin);

    const pluginMap = await loadModulePlugins(BASE_URL);

    // Inner plugins should be registered by their own names
    expect(pluginMap.size).toBe(2);
    expect(pluginMap.has('test-plugin-inner-1')).toBe(true);
    expect(pluginMap.has('test-plugin-inner-2')).toBe(true);

    // The raw module should still be in the resolve map under the package name
    expect(resolve['@deephaven/js-plugin-test-plugin-multi']).toBeUndefined();
  });

  it('loads plugins from correct URLs based on manifest', async () => {
    const pluginA = makePlugin('test-plugin-a');

    mockManifest([
      { name: 'test-plugin-a', main: 'bundle.js', version: '1.0.0' },
    ]);

    loadRemoteModule.mockResolvedValueOnce(pluginA);

    await loadModulePlugins(BASE_URL);

    expect(loadRemoteModule).toHaveBeenCalledWith(
      `${BASE_URL}/test-plugin-a/bundle.js`
    );
  });

  it('uses manifest package field as resolve key when provided', async () => {
    const pluginA = makePlugin('test-plugin-a');
    const moduleExports = { default: pluginA };

    mockManifest([
      {
        name: 'test-plugin-a',
        main: 'index.js',
        version: '1.0.0',
        package: '@acme/grid-extras',
      },
    ]);

    loadRemoteModule.mockResolvedValueOnce(moduleExports);

    await loadModulePlugins(BASE_URL);

    // Should use the explicit package name, not the fallback
    expect(resolve['@acme/grid-extras']).toBe(moduleExports);
    expect(resolve['@deephaven/js-plugin-test-plugin-a']).toBeUndefined();
  });
});
