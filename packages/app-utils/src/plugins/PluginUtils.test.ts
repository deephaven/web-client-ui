import {
  type MultiPlugin,
  type Plugin,
  type PluginManifestPluginInfo,
  PluginType,
} from '@deephaven/plugin';
import { loadModulePlugins } from './PluginUtils';
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

describe('loadModulePlugins', () => {
  const BASE_URL = 'http://localhost:4100/plugins';

  // Snapshot the resolve map and global.fetch once so each test starts
  // from a known baseline regardless of what previous tests added.
  const originalResolveKeys = new Set(Object.keys(resolve));
  const originalFetch = global.fetch;

  function makePlugin(name: string): Plugin {
    return { name, type: PluginType.WIDGET_PLUGIN };
  }

  function mockManifest(plugins: PluginManifestPluginInfo[]) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ plugins }),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    // Remove any keys added to the shared resolve map by previous tests
    Object.keys(resolve).forEach(key => {
      if (!originalResolveKeys.has(key)) {
        delete resolve[key];
      }
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
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
        loader: { package: '@deephaven/js-plugin-test-plugin-a' },
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
        loader: { package: '@deephaven/js-plugin-test-plugin-a' },
      },
      {
        name: 'test-plugin-b',
        main: 'index.js',
        version: '1.0.0',
        loader: {
          package: '@deephaven/js-plugin-test-plugin-b',
          dependencies: ['@deephaven/js-plugin-test-plugin-a'],
        },
      },
    ]);

    const moduleA = { default: pluginA, ExportedClass: class MyClass {} };

    // Plugin B depends on A, so it loads in the next level.
    // When plugin B loads, verify plugin A is already in the resolve map.
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
        loader: { package: '@deephaven/js-plugin-test-plugin-a' },
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
        loader: { package: '@acme/grid-extras' },
      },
    ]);

    loadRemoteModule.mockResolvedValueOnce(moduleExports);

    await loadModulePlugins(BASE_URL);

    // Should use the explicit package name, not the fallback
    expect(resolve['@acme/grid-extras']).toBe(moduleExports);
    expect(resolve['@deephaven/js-plugin-test-plugin-a']).toBeUndefined();
  });
});
