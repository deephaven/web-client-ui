import { TestUtils } from '@deephaven/utils';
import ThemeCache from './ThemeCache';
import {
  DEFAULT_DARK_THEME_KEY,
  DEFAULT_LIGHT_THEME_KEY,
  DEFAULT_PRELOAD_DATA_VARIABLES,
} from './ThemeModel';
import {
  calculatePreloadStyleContent,
  getThemeKey,
  preloadTheme,
  registerBaseThemes,
} from './ThemeUtils';

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
