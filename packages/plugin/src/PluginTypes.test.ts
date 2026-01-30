import {
  PluginType,
  isAuthPlugin,
  isDashboardPlugin,
  isTablePlugin,
  isThemePlugin,
  isWidgetPlugin,
  isWidgetMiddlewarePlugin,
  type Plugin,
  type WidgetPlugin,
  type WidgetMiddlewarePlugin,
  isPlugin,
} from './PluginTypes';

const pluginTypeToTypeGuardMap = [
  [PluginType.DASHBOARD_PLUGIN, isDashboardPlugin],
  [PluginType.AUTH_PLUGIN, isAuthPlugin],
  [PluginType.TABLE_PLUGIN, isTablePlugin],
  [PluginType.THEME_PLUGIN, isThemePlugin],
  [PluginType.WIDGET_PLUGIN, isWidgetPlugin],
] as const;

const pluginTypeToPluginMap: [type: string, moduleValue: Plugin][] =
  Object.keys(PluginType).map(type => [
    type,
    { name: `${type}`, type: PluginType[type] },
  ]);

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

describe('isPlugin', () => {
  it.each(pluginTypeToPluginMap)('returns true for %s type', (type, plugin) => {
    expect(isPlugin(plugin)).toBe(true);
  });

  it('returns false for non-plugin types', () => {
    expect(isPlugin({ name: 'test', type: 'other' })).toBe(false);
    expect(isPlugin({})).toBe(false);
  });
});

describe('isWidgetMiddlewarePlugin', () => {
  const baseWidgetPlugin: WidgetPlugin = {
    name: 'test-widget',
    type: PluginType.WIDGET_PLUGIN,
    component: () => null,
    supportedTypes: 'test-type',
  };

  const middlewarePlugin: WidgetMiddlewarePlugin = {
    name: 'test-middleware',
    type: PluginType.WIDGET_PLUGIN,
    component: () => null,
    supportedTypes: 'test-type',
    isMiddleware: true,
  };

  it('returns true for middleware plugins', () => {
    expect(isWidgetMiddlewarePlugin(middlewarePlugin)).toBe(true);
  });

  it('returns false for regular widget plugins', () => {
    expect(isWidgetMiddlewarePlugin(baseWidgetPlugin)).toBe(false);
  });

  it('returns false for widget plugins with isMiddleware set to false', () => {
    const notMiddleware = {
      ...baseWidgetPlugin,
      isMiddleware: false,
    };
    expect(isWidgetMiddlewarePlugin(notMiddleware)).toBe(false);
  });

  it('returns false for non-widget plugins', () => {
    expect(
      isWidgetMiddlewarePlugin({
        name: 'test',
        type: PluginType.DASHBOARD_PLUGIN,
      })
    ).toBe(false);
  });
});
