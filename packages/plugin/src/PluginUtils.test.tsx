import React from 'react';
import { render, screen } from '@testing-library/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type ThemeData } from '@deephaven/components';
import { dhTruck, vsPreview } from '@deephaven/icons';
import {
  type DashboardPlugin,
  type ElementPlugin,
  type LegacyPlugin,
  type MultiPlugin,
  type Plugin,
  type PluginModule,
  type PluginModuleMap,
  PluginType,
  type ThemePlugin,
  type WidgetPlugin,
  type WidgetMiddlewarePlugin,
  type WidgetComponentProps,
  type WidgetMiddlewareComponentProps,
  type WidgetPanelProps,
  type WidgetMiddlewarePanelProps,
} from './PluginTypes';
import {
  pluginSupportsType,
  getIconForPlugin,
  getThemeDataFromPlugins,
  getPluginsElementMap,
  getPluginModuleValue,
  processLoadedModule,
  registerPlugin,
  sortPluginsByDependency,
  createChainedComponent,
  createChainedPanelComponent,
  type PluginManifestPluginInfo,
} from './PluginUtils';

function TestWidget() {
  return <div>TestWidget</div>;
}

const widgetPlugin: WidgetPlugin = {
  name: 'test-widget-plugin',
  type: PluginType.WIDGET_PLUGIN,
  component: TestWidget,
  supportedTypes: ['test-widget', 'test-widget-two'],
};

const dashboardPlugin: DashboardPlugin = {
  name: 'test-widget-plugin',
  type: PluginType.DASHBOARD_PLUGIN,
  component: TestWidget,
};

const ElementPluginOne: ElementPlugin = {
  name: 'test-element-plugin-one',
  type: PluginType.ELEMENT_PLUGIN,
  mapping: {
    'test-element-one': TestWidget,
    'test-element-two': TestWidget,
  },
};

const ElementPluginTwo: ElementPlugin = {
  name: 'test-element-plugin-two',
  type: PluginType.ELEMENT_PLUGIN,
  mapping: {
    'test-element-three': TestWidget,
  },
};

test('pluginSupportsType', () => {
  expect(pluginSupportsType(widgetPlugin, 'test-widget')).toBe(true);
  expect(pluginSupportsType(widgetPlugin, 'test-widget-two')).toBe(true);
  expect(pluginSupportsType(widgetPlugin, 'test-widget-three')).toBe(false);
  expect(pluginSupportsType(dashboardPlugin, 'test-widget')).toBe(false);
  expect(pluginSupportsType(undefined, 'test-widget')).toBe(false);
});

const DEFAULT_ICON = <FontAwesomeIcon icon={vsPreview} />;

describe('getIconForPlugin', () => {
  test('default icon', () => {
    expect(getIconForPlugin(widgetPlugin)).toEqual(DEFAULT_ICON);
  });

  test('default icon for non-widget plugin', () => {
    expect(getIconForPlugin(dashboardPlugin)).toEqual(DEFAULT_ICON);
  });

  test('custom icon', () => {
    const customIcon = <FontAwesomeIcon icon={dhTruck} />;
    const customWidgetPlugin: WidgetPlugin = {
      ...widgetPlugin,
      icon: dhTruck,
    };
    expect(getIconForPlugin(customWidgetPlugin)).toEqual(customIcon);
  });

  test('custom icon element', () => {
    const customIcon = <div>Test</div>;
    const customWidgetPlugin: WidgetPlugin = {
      ...widgetPlugin,
      icon: customIcon,
    };
    expect(getIconForPlugin(customWidgetPlugin)).toEqual(customIcon);
  });
});

describe('getThemeDataFromPlugins', () => {
  beforeEach(() => {
    document.body.removeAttribute('style');
    document.head.innerHTML = '';
    jest.clearAllMocks();
    expect.hasAssertions();
  });

  const themePluginSingleDark: ThemePlugin = {
    name: 'mock.themePluginNameA',
    type: 'ThemePlugin',
    themes: {
      name: 'mock.customDark',
      baseTheme: 'dark',
      styleContent: 'mock.styleContent',
    },
  };

  const themePluginSingleLight: ThemePlugin = {
    name: 'mock.themePluginNameB',
    type: 'ThemePlugin',
    themes: {
      name: 'mock.customLight',
      baseTheme: 'light',
      styleContent: 'mock.styleContent',
    },
  };

  const themePluginMultiConfig: ThemePlugin = {
    name: 'mock.themePluginNameC',
    type: 'ThemePlugin',
    themes: [
      {
        name: 'mock.customDark',
        baseTheme: 'dark',
        styleContent: 'mock.styleContent',
      },
      {
        name: 'mock.customLight',
        baseTheme: 'light',
        styleContent: 'mock.styleContent',
      },
      {
        name: 'mock.customUndefined',
        styleContent: 'mock.styleContent',
      },
    ],
  };

  const otherPlugin: DashboardPlugin = {
    name: 'mock.otherPluginName',
    type: 'DashboardPlugin',
    component: () => null,
  };

  const pluginMap = new Map<string, PluginModule>([
    ['mock.themePluginNameA', themePluginSingleDark],
    ['mock.themePluginNameB', themePluginSingleLight],
    ['mock.themePluginNameC', themePluginMultiConfig],
    ['mock.otherPluginName', otherPlugin],
  ]);

  it('should return theme data from plugins', () => {
    const actual = getThemeDataFromPlugins(pluginMap);
    const expected: ThemeData[] = [
      {
        name: 'mock.customDark',
        baseThemeKey: 'default-dark',
        themeKey: 'mock.themePluginNameA_mock.customDark',
        styleContent: 'mock.styleContent',
      },
      {
        name: 'mock.customLight',
        baseThemeKey: 'default-light',
        themeKey: 'mock.themePluginNameB_mock.customLight',
        styleContent: 'mock.styleContent',
      },
      {
        name: 'mock.customDark',
        baseThemeKey: 'default-dark',
        themeKey: 'mock.themePluginNameC_mock.customDark',
        styleContent: 'mock.styleContent',
      },
      {
        name: 'mock.customLight',
        baseThemeKey: 'default-light',
        themeKey: 'mock.themePluginNameC_mock.customLight',
        styleContent: 'mock.styleContent',
      },
      {
        name: 'mock.customUndefined',
        baseThemeKey: 'default-dark',
        themeKey: 'mock.themePluginNameC_mock.customUndefined',
        styleContent: 'mock.styleContent',
      },
    ];

    expect(actual).toEqual(expected);
  });
});

describe('getElementPluginMap', () => {
  it('should return a mapping of element plugins', () => {
    const pluginMap = new Map<string, PluginModule>([
      [ElementPluginOne.name, ElementPluginOne],
      [ElementPluginTwo.name, ElementPluginTwo],
      [dashboardPlugin.name, dashboardPlugin],
      [widgetPlugin.name, widgetPlugin],
    ]);

    const elementMapping = getPluginsElementMap(pluginMap);

    expect(elementMapping.size).toBe(3);
    expect(elementMapping.get('test-element-one')).toBe(TestWidget);
    expect(elementMapping.get('test-element-two')).toBe(TestWidget);
    expect(elementMapping.get('test-element-three')).toBe(TestWidget);
  });

  it('should return an empty map if no element plugins are present', () => {
    const pluginMap2 = new Map<string, PluginModule>([
      [widgetPlugin.name, widgetPlugin],
      [dashboardPlugin.name, dashboardPlugin],
    ]);

    const elementMapping = getPluginsElementMap(pluginMap2);

    expect(elementMapping.size).toBe(0);
  });
});

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
          name: 'widgetPlugin2',
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

  it('returns null for { default: null }', () => {
    const moduleValue = getPluginModuleValue({
      default: null,
    } as unknown as Plugin);
    expect(moduleValue).toBeNull();
  });

  it('returns null for { default: undefined }', () => {
    const moduleValue = getPluginModuleValue({
      default: undefined,
    } as unknown as Plugin);
    expect(moduleValue).toBeNull();
  });

  describe('MultiPlugin', () => {
    const multiPlugin: MultiPlugin = {
      name: 'test-multi-plugin',
      type: PluginType.MULTI_PLUGIN,
      plugins: [
        { name: 'widget-plugin', type: PluginType.WIDGET_PLUGIN },
        { name: 'dashboard-plugin2', type: PluginType.DASHBOARD_PLUGIN },
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

describe('registerPlugin', () => {
  function makePlugin(name: string): Plugin {
    return { name, type: PluginType.WIDGET_PLUGIN };
  }

  it('registers a plugin in the map', () => {
    const regPluginMap: PluginModuleMap = new Map();
    const plugin = makePlugin('my-plugin');

    registerPlugin(regPluginMap, 'my-plugin', plugin, '1.0.0');

    expect(regPluginMap.get('my-plugin')).toEqual({
      ...plugin,
      version: '1.0.0',
    });
  });

  it('skips duplicate and keeps the first registration', () => {
    const regPluginMap: PluginModuleMap = new Map();
    const first = makePlugin('my-plugin');
    const second = makePlugin('my-plugin');

    registerPlugin(regPluginMap, 'my-plugin', first, '1.0.0');
    registerPlugin(regPluginMap, 'my-plugin', second, '2.0.0');

    expect(regPluginMap.size).toBe(1);
    expect(regPluginMap.get('my-plugin')).toEqual({
      ...first,
      version: '1.0.0',
    });
  });
});

describe('processLoadedModule', () => {
  function makePlugin(name: string): Plugin {
    return { name, type: PluginType.WIDGET_PLUGIN };
  }

  let procPluginMap: PluginModuleMap;
  let resolveMap: Record<string, unknown>;

  beforeEach(() => {
    procPluginMap = new Map();
    resolveMap = {};
  });

  it('registers a simple plugin', () => {
    const plugin = makePlugin('my-plugin');
    processLoadedModule(
      procPluginMap,
      resolveMap,
      plugin,
      'my-plugin',
      null,
      '1.0.0'
    );

    expect(procPluginMap.size).toBe(1);
    expect(procPluginMap.get('my-plugin')).toEqual({
      ...plugin,
      version: '1.0.0',
    });
  });

  it('registers a plugin with default export', () => {
    const plugin = makePlugin('my-plugin');
    processLoadedModule(
      procPluginMap,
      resolveMap,
      { default: plugin },
      'my-plugin'
    );

    expect(procPluginMap.size).toBe(1);
    expect(procPluginMap.get('my-plugin')).toEqual({
      ...plugin,
      version: undefined,
    });
  });

  it('registers in resolve map when packageName is provided', () => {
    const plugin = makePlugin('my-plugin');
    const pluginExports = { default: plugin };
    processLoadedModule(
      procPluginMap,
      resolveMap,
      pluginExports,
      'my-plugin',
      '@scope/my-plugin'
    );

    expect(resolveMap['@scope/my-plugin']).toBe(pluginExports);
  });

  it('does not register in resolve map when packageName is null', () => {
    const plugin = makePlugin('my-plugin');
    processLoadedModule(procPluginMap, resolveMap, plugin, 'my-plugin', null);

    expect(Object.keys(resolveMap)).toHaveLength(0);
  });

  it('does not register in resolve map when packageName is undefined', () => {
    const plugin = makePlugin('my-plugin');
    processLoadedModule(procPluginMap, resolveMap, plugin, 'my-plugin');

    expect(Object.keys(resolveMap)).toHaveLength(0);
  });

  it('flattens MultiPlugin and registers inner plugins', () => {
    const multi: MultiPlugin = {
      name: 'multi',
      type: PluginType.MULTI_PLUGIN,
      plugins: [makePlugin('inner-a'), makePlugin('inner-b')] as Plugin[],
    };

    processLoadedModule(
      procPluginMap,
      resolveMap,
      multi,
      'multi',
      null,
      '1.0.0'
    );

    expect(procPluginMap.size).toBe(2);
    expect(procPluginMap.has('inner-a')).toBe(true);
    expect(procPluginMap.has('inner-b')).toBe(true);
    expect(procPluginMap.has('multi')).toBe(false);
  });

  it('skips invalid inner plugins in MultiPlugin', () => {
    const multi: MultiPlugin = {
      name: 'multi',
      type: PluginType.MULTI_PLUGIN,
      plugins: [
        makePlugin('valid'),
        { notAPlugin: true } as unknown as Plugin,
      ] as Plugin[],
    };

    processLoadedModule(procPluginMap, resolveMap, multi, 'multi');

    expect(procPluginMap.size).toBe(1);
    expect(procPluginMap.has('valid')).toBe(true);
  });

  it('skips inner plugins with empty names in MultiPlugin', () => {
    const multi: MultiPlugin = {
      name: 'multi',
      type: PluginType.MULTI_PLUGIN,
      plugins: [
        makePlugin('valid'),
        { name: '', type: PluginType.WIDGET_PLUGIN } as Plugin,
        { name: '  ', type: PluginType.WIDGET_PLUGIN } as Plugin,
      ] as Plugin[],
    };

    processLoadedModule(procPluginMap, resolveMap, multi, 'multi');

    expect(procPluginMap.size).toBe(1);
    expect(procPluginMap.has('valid')).toBe(true);
  });

  it('skips duplicate inner plugins in MultiPlugin', () => {
    const multi: MultiPlugin = {
      name: 'multi',
      type: PluginType.MULTI_PLUGIN,
      plugins: [makePlugin('dupe'), makePlugin('dupe')] as Plugin[],
    };

    processLoadedModule(procPluginMap, resolveMap, multi, 'multi');

    expect(procPluginMap.size).toBe(1);
  });

  it('does not register when module value is null', () => {
    processLoadedModule(procPluginMap, resolveMap, {} as Plugin, 'bad-plugin');

    expect(procPluginMap.size).toBe(0);
  });

  it('handles legacy plugin format', () => {
    const legacy: LegacyPlugin = { TablePlugin: () => null };
    processLoadedModule(
      procPluginMap,
      resolveMap,
      legacy,
      'legacy-plugin',
      null,
      '1.0.0'
    );

    expect(procPluginMap.size).toBe(1);
    expect(procPluginMap.get('legacy-plugin')).toEqual({
      ...legacy,
      version: '1.0.0',
    });
  });
});

describe('sortPluginsByDependency', () => {
  function makeManifestPlugin(
    name: string,
    opts?: {
      package?: string;
      dependencies?: string[];
    }
  ): PluginManifestPluginInfo {
    return {
      name,
      main: 'index.js',
      version: '1.0.0',
      package: opts?.package,
      dependencies: opts?.dependencies,
    };
  }

  it('returns plugins in original order when no dependencies', () => {
    const plugins = [
      makeManifestPlugin('a'),
      makeManifestPlugin('b'),
      makeManifestPlugin('c'),
    ];

    const sorted = sortPluginsByDependency(plugins);

    expect(sorted.map(p => p.name)).toEqual(['a', 'b', 'c']);
  });

  it('reorders so dependency loads before consumer', () => {
    const plugins = [
      makeManifestPlugin('consumer', {
        dependencies: ['@scope/dep'],
      }),
      makeManifestPlugin('dep', {
        package: '@scope/dep',
      }),
    ];

    const sorted = sortPluginsByDependency(plugins);

    expect(sorted.map(p => p.name)).toEqual(['dep', 'consumer']);
  });

  it('handles a chain of dependencies: a → b → c', () => {
    const plugins = [
      makeManifestPlugin('c', {
        package: '@scope/c',
        dependencies: ['@scope/b'],
      }),
      makeManifestPlugin('b', {
        package: '@scope/b',
        dependencies: ['@scope/a'],
      }),
      makeManifestPlugin('a', {
        package: '@scope/a',
      }),
    ];

    const sorted = sortPluginsByDependency(plugins);

    const names = sorted.map(p => p.name);
    expect(names.indexOf('a')).toBeLessThan(names.indexOf('b'));
    expect(names.indexOf('b')).toBeLessThan(names.indexOf('c'));
  });

  it('preserves original order among independent plugins', () => {
    const plugins = [
      makeManifestPlugin('x'),
      makeManifestPlugin('dep', { package: '@scope/dep' }),
      makeManifestPlugin('y'),
      makeManifestPlugin('consumer', { dependencies: ['@scope/dep'] }),
      makeManifestPlugin('z'),
    ];

    const sorted = sortPluginsByDependency(plugins);

    const names = sorted.map(p => p.name);
    // dep must come before consumer
    expect(names.indexOf('dep')).toBeLessThan(names.indexOf('consumer'));
    // independent plugins keep their relative order
    expect(names.indexOf('x')).toBeLessThan(names.indexOf('y'));
    expect(names.indexOf('y')).toBeLessThan(names.indexOf('z'));
  });

  it('throws on circular dependencies', () => {
    const plugins = [
      makeManifestPlugin('a', {
        package: '@scope/a',
        dependencies: ['@scope/b'],
      }),
      makeManifestPlugin('b', {
        package: '@scope/b',
        dependencies: ['@scope/a'],
      }),
    ];

    expect(() => sortPluginsByDependency(plugins)).toThrow(
      /Circular plugin dependency/
    );
  });

  it('warns and ignores dependencies not in the manifest', () => {
    const plugins = [
      makeManifestPlugin('consumer', {
        dependencies: ['@scope/nonexistent'],
      }),
    ];

    const sorted = sortPluginsByDependency(plugins);

    expect(sorted.map(p => p.name)).toEqual(['consumer']);
  });

  it('handles multiple dependencies', () => {
    const plugins = [
      makeManifestPlugin('consumer', {
        dependencies: ['@scope/dep-a', '@scope/dep-b'],
      }),
      makeManifestPlugin('dep-a', { package: '@scope/dep-a' }),
      makeManifestPlugin('dep-b', { package: '@scope/dep-b' }),
    ];

    const sorted = sortPluginsByDependency(plugins);

    const names = sorted.map(p => p.name);
    expect(names.indexOf('dep-a')).toBeLessThan(names.indexOf('consumer'));
    expect(names.indexOf('dep-b')).toBeLessThan(names.indexOf('consumer'));
  });

  it('does not mutate the input array', () => {
    const plugins = [
      makeManifestPlugin('consumer', { dependencies: ['@scope/dep'] }),
      makeManifestPlugin('dep', { package: '@scope/dep' }),
    ];
    const original = [...plugins];

    sortPluginsByDependency(plugins);

    expect(plugins).toEqual(original);
  });

  it('handles empty plugin list', () => {
    expect(sortPluginsByDependency([])).toEqual([]);
  });

  it('handles plugins with empty dependencies array', () => {
    const plugins = [
      makeManifestPlugin('a', { dependencies: [] }),
      makeManifestPlugin('b'),
    ];

    const sorted = sortPluginsByDependency(plugins);

    expect(sorted.map(p => p.name)).toEqual(['a', 'b']);
  });
});

describe('createChainedComponent', () => {
  function BaseWidget({ fetch }: WidgetComponentProps) {
    return <div data-testid="base">BaseWidget</div>;
  }

  function makeMiddleware(name: string, label: string): WidgetMiddlewarePlugin {
    function MiddlewareComp({
      Component,
      ...props
    }: WidgetMiddlewareComponentProps) {
      return (
        <div data-testid={name}>
          <span>{label}</span>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Component {...props} />
        </div>
      );
    }
    return {
      name,
      type: PluginType.MIDDLEWARE_PLUGIN,
      supportedTypes: 'test-type',
      component: MiddlewareComp,
    };
  }

  it('returns base component unchanged when no middleware', () => {
    const result = createChainedComponent(BaseWidget, []);
    expect(result).toBe(BaseWidget);
  });

  it('wraps base component with single middleware', () => {
    const mw = makeMiddleware('mw-a', 'A');
    const Chained = createChainedComponent(BaseWidget, [mw]);

    expect(Chained).not.toBe(BaseWidget);
    expect(Chained.displayName).toBe('mw-a(BaseWidget)');
  });

  it('chains multiple middleware in correct order', () => {
    const mwA = makeMiddleware('mw-a', 'A');
    const mwB = makeMiddleware('mw-b', 'B');
    const Chained = createChainedComponent(BaseWidget, [mwA, mwB]);

    // First middleware is outermost
    expect(Chained.displayName).toBe('mw-a(mw-b(BaseWidget))');
  });

  it('sets displayName for each layer', () => {
    const mwA = makeMiddleware('outer', 'Outer');
    const mwB = makeMiddleware('inner', 'Inner');
    const Chained = createChainedComponent(BaseWidget, [mwA, mwB]);

    expect(Chained.displayName).toContain('outer');
    expect(Chained.displayName).toContain('inner');
    expect(Chained.displayName).toContain('BaseWidget');
  });

  it('skips middleware when widget type does not match supportedTypes', () => {
    const mw = makeMiddleware('table-mw', 'TableOnly');
    // Override supportedTypes to only target 'table-type'
    mw.supportedTypes = 'table-type';
    const Chained = createChainedComponent(BaseWidget, [mw]);

    const { container } = render(
      <Chained fetch={jest.fn()} metadata={{ type: 'other-type' }} />
    );

    // Middleware should be skipped — base widget rendered directly
    expect(screen.getByTestId('base')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="table-mw"]')).toBeNull();
  });

  it('applies middleware when widget type matches supportedTypes', () => {
    const mw = makeMiddleware('table-mw', 'TableOnly');
    mw.supportedTypes = 'table-type';
    const Chained = createChainedComponent(BaseWidget, [mw]);

    render(<Chained fetch={jest.fn()} metadata={{ type: 'table-type' }} />);

    // Middleware should be applied
    expect(screen.getByTestId('table-mw')).toBeInTheDocument();
    expect(screen.getByTestId('base')).toBeInTheDocument();
  });

  it('applies middleware when metadata is undefined', () => {
    const mw = makeMiddleware('mw-a', 'A');
    const Chained = createChainedComponent(BaseWidget, [mw]);

    render(<Chained fetch={jest.fn()} />);

    // No metadata means type is unknown — middleware should apply
    expect(screen.getByTestId('mw-a')).toBeInTheDocument();
    expect(screen.getByTestId('base')).toBeInTheDocument();
  });
});

describe('createChainedPanelComponent', () => {
  function BasePanel({ fetch }: WidgetPanelProps) {
    return <div data-testid="base-panel">BasePanel</div>;
  }

  function makePanelMiddleware(
    name: string,
    opts?: { hasPanelComponent?: boolean }
  ): WidgetMiddlewarePlugin {
    const hasPanelComp = opts?.hasPanelComponent ?? true;

    function MiddlewareComp({
      Component,
      ...props
    }: WidgetMiddlewareComponentProps) {
      return (
        <div>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Component {...props} />
        </div>
      );
    }

    function PanelComp({ Component, ...props }: WidgetMiddlewarePanelProps) {
      return (
        <div data-testid={`${name}-panel`}>
          <span>{name}</span>
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <Component {...props} />
        </div>
      );
    }

    return {
      name,
      type: PluginType.MIDDLEWARE_PLUGIN,
      supportedTypes: 'test-type',
      component: MiddlewareComp,
      panelComponent: hasPanelComp ? PanelComp : undefined,
    };
  }

  it('returns base panel unchanged when no middleware', () => {
    const result = createChainedPanelComponent(BasePanel, []);
    expect(result).toBe(BasePanel);
  });

  it('returns base panel unchanged when middleware lacks panelComponent', () => {
    const mw = makePanelMiddleware('mw-no-panel', {
      hasPanelComponent: false,
    });
    const result = createChainedPanelComponent(BasePanel, [mw]);
    expect(result).toBe(BasePanel);
  });

  it('wraps base panel with single panel middleware', () => {
    const mw = makePanelMiddleware('mw-panel');
    const Chained = createChainedPanelComponent(BasePanel, [mw]);

    expect(Chained).not.toBe(BasePanel);
    expect(Chained.displayName).toBe('mw-panelPanel(BasePanel)');
  });

  it('chains multiple panel middleware in correct order', () => {
    const mwA = makePanelMiddleware('outer');
    const mwB = makePanelMiddleware('inner');
    const Chained = createChainedPanelComponent(BasePanel, [mwA, mwB]);

    expect(Chained.displayName).toBe('outerPanel(innerPanel(BasePanel))');
  });

  it('filters out middleware without panelComponent', () => {
    const mwWithPanel = makePanelMiddleware('with-panel', {
      hasPanelComponent: true,
    });
    const mwWithout = makePanelMiddleware('without-panel', {
      hasPanelComponent: false,
    });
    const Chained = createChainedPanelComponent(BasePanel, [
      mwWithPanel,
      mwWithout,
    ]);

    // Only the middleware with panelComponent should be applied
    expect(Chained.displayName).toBe('with-panelPanel(BasePanel)');
  });

  it('skips panel middleware when widget type does not match supportedTypes', () => {
    const mw = makePanelMiddleware('table-panel-mw');
    mw.supportedTypes = 'table-type';
    const Chained = createChainedPanelComponent(BasePanel, [mw]);

    const panelProps = {
      fetch: jest.fn(),
      metadata: { type: 'other-type' },
      localDashboardId: 'test',
      glContainer: {} as WidgetPanelProps['glContainer'],
      glEventHub: {} as WidgetPanelProps['glEventHub'],
    };

    const { container } = render(
      // eslint-disable-next-line react/jsx-props-no-spreading
      <Chained {...panelProps} />
    );

    // Middleware should be skipped
    expect(screen.getByTestId('base-panel')).toBeInTheDocument();
    expect(
      container.querySelector('[data-testid="table-panel-mw-panel"]')
    ).toBeNull();
  });

  it('applies panel middleware when widget type matches supportedTypes', () => {
    const mw = makePanelMiddleware('table-panel-mw');
    mw.supportedTypes = 'table-type';
    const Chained = createChainedPanelComponent(BasePanel, [mw]);

    const panelProps = {
      fetch: jest.fn(),
      metadata: { type: 'table-type' },
      localDashboardId: 'test',
      glContainer: {} as WidgetPanelProps['glContainer'],
      glEventHub: {} as WidgetPanelProps['glEventHub'],
    };

    // eslint-disable-next-line react/jsx-props-no-spreading
    render(<Chained {...panelProps} />);

    // Middleware should be applied
    expect(screen.getByTestId('table-panel-mw-panel')).toBeInTheDocument();
    expect(screen.getByTestId('base-panel')).toBeInTheDocument();
  });
});
