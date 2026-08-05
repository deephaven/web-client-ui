import {
  PluginType,
  type PluginModuleMap,
  type PluginModuleExport,
  type WidgetPlugin,
  type WidgetMiddlewarePlugin,
} from '@deephaven/plugin';
import {
  getSupportedWidgetTypes,
  getUniqueWidgetPluginInfos,
  type ValidWidgetTypeInfo,
} from './WidgetLoaderUtils';

function TestComponent() {
  return null;
}

function makeWidgetPlugin(
  name: string,
  supportedTypes: string | string[]
): WidgetPlugin {
  return {
    name,
    type: PluginType.WIDGET_PLUGIN,
    supportedTypes,
    component: TestComponent,
  };
}

function makeMiddlewarePlugin(
  name: string,
  supportedTypes: string | string[]
): WidgetMiddlewarePlugin {
  return {
    name,
    type: PluginType.MIDDLEWARE_PLUGIN,
    supportedTypes,
    component: TestComponent,
  };
}

function makePluginMap(
  plugins: [string, PluginModuleExport][]
): PluginModuleMap {
  return new Map(plugins) as PluginModuleMap;
}

describe('getSupportedWidgetTypes', () => {
  it('returns an empty map when there are no plugins', () => {
    expect(getSupportedWidgetTypes(makePluginMap([]))).toEqual(new Map());
  });

  it('ignores plugins that are not widget or middleware plugins', () => {
    const themePlugin = {
      name: 'theme',
      type: PluginType.THEME_PLUGIN,
      themes: [],
    } as PluginModuleExport;

    expect(
      getSupportedWidgetTypes(makePluginMap([['theme', themePlugin]]))
    ).toEqual(new Map());
  });

  it('maps a single supported type to its base plugin', () => {
    const plugin = makeWidgetPlugin('widget', 'test-widget');

    expect(
      getSupportedWidgetTypes(makePluginMap([['widget', plugin]]))
    ).toEqual(
      new Map([['test-widget', { basePlugin: plugin, middleware: [] }]])
    );
  });

  it('maps every type when supportedTypes is an array', () => {
    const plugin = makeWidgetPlugin('widget', ['type-a', 'type-b']);

    expect(
      getSupportedWidgetTypes(makePluginMap([['widget', plugin]]))
    ).toEqual(
      new Map([
        ['type-a', { basePlugin: plugin, middleware: [] }],
        ['type-b', { basePlugin: plugin, middleware: [] }],
      ])
    );
  });

  it.each([[''], [null], [undefined]])(
    'skips empty or nullish supported type %s',
    supportedType => {
      const plugin = makeWidgetPlugin('widget', [
        supportedType as unknown as string,
        'type-a',
      ]);

      expect(
        getSupportedWidgetTypes(makePluginMap([['widget', plugin]]))
      ).toEqual(new Map([['type-a', { basePlugin: plugin, middleware: [] }]]));
    }
  );

  it('replaces the base plugin when multiple widget plugins handle the same type', () => {
    const first = makeWidgetPlugin('first', 'test-widget');
    const second = makeWidgetPlugin('second', 'test-widget');

    expect(
      getSupportedWidgetTypes(
        makePluginMap([
          ['first', first],
          ['second', second],
        ])
      )
    ).toEqual(
      new Map([['test-widget', { basePlugin: second, middleware: [] }]])
    );
  });

  it('adds middleware registered after the base plugin', () => {
    const base = makeWidgetPlugin('base', 'test-widget');
    const middleware = makeMiddlewarePlugin('middleware', 'test-widget');

    expect(
      getSupportedWidgetTypes(
        makePluginMap([
          ['base', base],
          ['middleware', middleware],
        ])
      )
    ).toEqual(
      new Map([['test-widget', { basePlugin: base, middleware: [middleware] }]])
    );
  });

  it('adds middleware registered before the base plugin', () => {
    const middleware = makeMiddlewarePlugin('middleware', 'test-widget');
    const base = makeWidgetPlugin('base', 'test-widget');

    expect(
      getSupportedWidgetTypes(
        makePluginMap([
          ['middleware', middleware],
          ['base', base],
        ])
      )
    ).toEqual(
      new Map([['test-widget', { basePlugin: base, middleware: [middleware] }]])
    );
  });

  it('keeps middleware in registration order', () => {
    const base = makeWidgetPlugin('base', 'test-widget');
    const middlewareA = makeMiddlewarePlugin('middleware-a', 'test-widget');
    const middlewareB = makeMiddlewarePlugin('middleware-b', 'test-widget');

    expect(
      getSupportedWidgetTypes(
        makePluginMap([
          ['middleware-a', middlewareA],
          ['base', base],
          ['middleware-b', middlewareB],
        ])
      )
    ).toEqual(
      new Map([
        [
          'test-widget',
          { basePlugin: base, middleware: [middlewareA, middlewareB] },
        ],
      ])
    );
  });

  it('keeps existing middleware when the base plugin is replaced', () => {
    const first = makeWidgetPlugin('first', 'test-widget');
    const middleware = makeMiddlewarePlugin('middleware', 'test-widget');
    const second = makeWidgetPlugin('second', 'test-widget');

    expect(
      getSupportedWidgetTypes(
        makePluginMap([
          ['first', first],
          ['middleware', middleware],
          ['second', second],
        ])
      )
    ).toEqual(
      new Map([
        ['test-widget', { basePlugin: second, middleware: [middleware] }],
      ])
    );
  });

  it('omits types that only have middleware registered', () => {
    const base = makeWidgetPlugin('base', 'type-a');
    const middleware = makeMiddlewarePlugin('middleware', ['type-a', 'type-b']);

    expect(
      getSupportedWidgetTypes(
        makePluginMap([
          ['base', base],
          ['middleware', middleware],
        ])
      )
    ).toEqual(
      new Map([['type-a', { basePlugin: base, middleware: [middleware] }]])
    );
  });
});

describe('getUniqueWidgetPluginInfos', () => {
  it('returns an empty map when there are no supported types', () => {
    expect(getUniqueWidgetPluginInfos(new Map())).toEqual(new Map());
  });

  it('keys the result by base plugin name', () => {
    const base = makeWidgetPlugin('base', 'type-a');
    const middleware = makeMiddlewarePlugin('middleware', 'type-a');
    const supportedTypes = new Map<string, ValidWidgetTypeInfo>([
      ['type-a', { basePlugin: base, middleware: [middleware] }],
    ]);

    expect(getUniqueWidgetPluginInfos(supportedTypes)).toEqual(
      new Map([['base', { basePlugin: base, middleware: [middleware] }]])
    );
  });

  it('does not mutate the source map when merging', () => {
    const base = makeWidgetPlugin('base', ['type-a', 'type-b']);
    const middlewareA = makeMiddlewarePlugin('middleware-a', 'type-a');
    const middlewareB = makeMiddlewarePlugin('middleware-b', 'type-b');
    const typeAInfo = { basePlugin: base, middleware: [middlewareA] };
    const supportedTypes = new Map<string, ValidWidgetTypeInfo>([
      ['type-a', typeAInfo],
      ['type-b', { basePlugin: base, middleware: [middlewareB] }],
    ]);

    getUniqueWidgetPluginInfos(supportedTypes);

    expect(typeAInfo.middleware).toEqual([middlewareA]);
  });

  it('merges middleware across types handled by the same base plugin', () => {
    const base = makeWidgetPlugin('base', ['type-a', 'type-b']);
    const middlewareA = makeMiddlewarePlugin('middleware-a', 'type-a');
    const middlewareB = makeMiddlewarePlugin('middleware-b', 'type-b');
    const supportedTypes = new Map<string, ValidWidgetTypeInfo>([
      ['type-a', { basePlugin: base, middleware: [middlewareA] }],
      ['type-b', { basePlugin: base, middleware: [middlewareB] }],
    ]);

    expect(getUniqueWidgetPluginInfos(supportedTypes)).toEqual(
      new Map([
        ['base', { basePlugin: base, middleware: [middlewareA, middlewareB] }],
      ])
    );
  });

  it('does not duplicate middleware shared across types', () => {
    const base = makeWidgetPlugin('base', ['type-a', 'type-b']);
    const middleware = makeMiddlewarePlugin('middleware', ['type-a', 'type-b']);
    const supportedTypes = new Map<string, ValidWidgetTypeInfo>([
      ['type-a', { basePlugin: base, middleware: [middleware] }],
      ['type-b', { basePlugin: base, middleware: [middleware] }],
    ]);

    expect(getUniqueWidgetPluginInfos(supportedTypes)).toEqual(
      new Map([['base', { basePlugin: base, middleware: [middleware] }]])
    );
  });

  it('keeps separate entries for different base plugins', () => {
    const baseA = makeWidgetPlugin('base-a', 'type-a');
    const baseB = makeWidgetPlugin('base-b', 'type-b');
    const supportedTypes = new Map<string, ValidWidgetTypeInfo>([
      ['type-a', { basePlugin: baseA, middleware: [] }],
      ['type-b', { basePlugin: baseB, middleware: [] }],
    ]);

    expect(getUniqueWidgetPluginInfos(supportedTypes)).toEqual(
      new Map([
        ['base-a', { basePlugin: baseA, middleware: [] }],
        ['base-b', { basePlugin: baseB, middleware: [] }],
      ])
    );
  });
});
