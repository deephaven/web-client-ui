import { ThemeData } from '@deephaven/components';
import { DashboardPlugin, PluginModule, ThemePlugin } from '@deephaven/plugin';
import { getThemeDataFromPlugins } from './PluginUtils';

beforeEach(() => {
  document.body.removeAttribute('style');
  document.head.innerHTML = '';
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('getThemeDataFromPlugins', () => {
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
        themeKey: 'mock-themepluginnamea_mock-customdark',
        styleContent: 'mock.styleContent',
      },
      {
        name: 'mock.customLight',
        baseThemeKey: 'default-light',
        themeKey: 'mock-themepluginnameb_mock-customlight',
        styleContent: 'mock.styleContent',
      },
      {
        name: 'mock.customDark',
        baseThemeKey: 'default-dark',
        themeKey: 'mock-themepluginnamec_mock-customdark',
        styleContent: 'mock.styleContent',
      },
      {
        name: 'mock.customLight',
        baseThemeKey: 'default-light',
        themeKey: 'mock-themepluginnamec_mock-customlight',
        styleContent: 'mock.styleContent',
      },
      {
        name: 'mock.customUndefined',
        baseThemeKey: 'default-dark',
        themeKey: 'mock-themepluginnamec_mock-customundefined',
        styleContent: 'mock.styleContent',
      },
    ];

    expect(actual).toEqual(expected);
  });
});
