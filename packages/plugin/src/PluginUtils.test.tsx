import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type ThemeData } from '@deephaven/components';
import { dhTruck, vsPreview } from '@deephaven/icons';
import {
  type DashboardPlugin,
  type ElementPlugin,
  type PluginModule,
  PluginType,
  type ThemePlugin,
  type WidgetPlugin,
} from './PluginTypes';
import {
  pluginSupportsType,
  getIconForPlugin,
  getThemeDataFromPlugins,
  getElementPluginMapping,
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

describe('getElementPluginMapping', () => {
  it('should return a mapping of element plugins', () => {
    const pluginMap = new Map<string, PluginModule>([
      [ElementPluginOne.name, ElementPluginOne],
      [ElementPluginTwo.name, ElementPluginTwo],
      [dashboardPlugin.name, dashboardPlugin],
      [widgetPlugin.name, widgetPlugin],
    ]);

    const elementMapping = getElementPluginMapping(pluginMap);

    expect(elementMapping.size).toBe(3);
    expect(elementMapping.get('test-element-one')).toBe(TestWidget);
    expect(elementMapping.get('test-element-two')).toBe(TestWidget);
    expect(elementMapping.get('test-element-three')).toBe(TestWidget);
  });

  it('should return an empty map if no element plugins are present', () => {
    const pluginMap = new Map<string, PluginModule>([
      [widgetPlugin.name, widgetPlugin],
      [dashboardPlugin.name, dashboardPlugin],
    ]);

    const elementMapping = getElementPluginMapping(pluginMap);

    expect(elementMapping.size).toBe(0);
  });
});
