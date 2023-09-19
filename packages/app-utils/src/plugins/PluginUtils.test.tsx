import {
  calculatePreloadStyleContent,
  DEFAULT_DARK_THEME_KEY,
  DEFAULT_LIGHT_THEME_KEY,
  DEFAULT_PRELOAD_DATA_VARIABLES,
  getThemeKey,
  preloadTheme,
  registerBaseThemes,
  ThemeCache,
  ThemeData,
} from '@deephaven/components';
import { DashboardPlugin, PluginModule, ThemePlugin } from '@deephaven/plugin';
import { TestUtils } from '@deephaven/utils';
import { getThemeDataFromPlugins } from './PluginUtils';

const { asMock, createMockProxy } = TestUtils;

beforeEach(() => {
  document.body.removeAttribute('style');
  document.head.innerHTML = '';
  jest.clearAllMocks();
  expect.hasAssertions();
});

describe('calculatePreloadStyleContent', () => {
  it('should set defaults if css variables are not defined', () => {
    expect(calculatePreloadStyleContent()).toEqual(
      `:root{--dh-accent-color:${DEFAULT_PRELOAD_DATA_VARIABLES['--dh-accent-color']};--dh-background-color:${DEFAULT_PRELOAD_DATA_VARIABLES['--dh-background-color']}}`
    );
  });

  it('should resolve css variables', () => {
    document.body.style.setProperty('--dh-accent-color', 'pink');
    document.body.style.setProperty('--dh-background-color', 'orange');

    expect(calculatePreloadStyleContent()).toEqual(
      ':root{--dh-accent-color:pink;--dh-background-color:orange}'
    );
  });
});

describe('getThemeDataFromPlugins', () => {
  const themePluginSingleDark: ThemePlugin = {
    name: 'mock.themePluginNameA',
    type: 'ThemePlugin',
    config: {
      name: 'mock.customDark',
      baseTheme: 'dark',
      styleContent: 'mock.styleContent',
    },
  };

  const themePluginSingleLight: ThemePlugin = {
    name: 'mock.themePluginNameB',
    type: 'ThemePlugin',
    config: {
      name: 'mock.customLight',
      baseTheme: 'light',
      styleContent: 'mock.styleContent',
    },
  };

  const themePluginMultiConfig: ThemePlugin = {
    name: 'mock.themePluginNameC',
    type: 'ThemePlugin',
    config: [
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

describe('getThemeKey', () => {
  it.each([
    ['PluginPath/Xxx/yyY', 'Plugin Aaa', 'pluginpath-xxx-yyy_plugin-aaa'],
    ['PluginPath', 'Plugin *+-@$ 99.8', 'pluginpath_plugin-99-8'],
  ])(
    'should combine and format the plugin root path and theme name: %s, %s',
    (pluginRootPath, themeName, expected) => {
      const actual = getThemeKey(pluginRootPath, themeName);
      expect(actual).toBe(expected);
    }
  );
});

describe('preloadTheme', () => {
  const themeCache = createMockProxy<ThemeCache>();

  it.each([
    null,
    {
      themeKey: 'mock.themeKey',
      preloadStyleContent: ':root{mock.preloadStyleContent}',
    },
  ] as const)('should set the style content: %s', preloadData => {
    asMock(themeCache.getPreloadData).mockReturnValue(preloadData);

    preloadTheme(themeCache);

    const styleEl = document.querySelector('style');

    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).toEqual(
      preloadData?.preloadStyleContent ?? calculatePreloadStyleContent()
    );
  });
});

describe('registerBaseThemes', () => {
  const themeCache = createMockProxy<ThemeCache>();

  it('should register default base themes in the theme cache', () => {
    registerBaseThemes(themeCache);

    expect(themeCache.registerBaseThemes).toHaveBeenCalledWith([
      {
        name: 'Default Dark',
        themeKey: DEFAULT_DARK_THEME_KEY,
        styleContent: {},
      },
      {
        name: 'Default Light',
        themeKey: DEFAULT_LIGHT_THEME_KEY,
        styleContent: {},
      },
    ]);
  });
});
