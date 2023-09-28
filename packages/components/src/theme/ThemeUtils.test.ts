import {
  DEFAULT_PRELOAD_DATA_VARIABLES,
  ThemeData,
  ThemeRegistrationData,
  THEME_CACHE_LOCAL_STORAGE_KEY,
} from './ThemeModel';
import {
  calculatePreloadStyleContent,
  getActiveThemes,
  getDefaultBaseThemes,
  getThemeKey,
  getThemePreloadData,
  preloadTheme,
  setThemePreloadData,
} from './ThemeUtils';

beforeEach(() => {
  document.body.removeAttribute('style');
  document.head.innerHTML = '';
  localStorage.clear();
  jest.clearAllMocks();
  jest.restoreAllMocks();
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

describe('getActiveThemes', () => {
  const mockTheme = {
    base: {
      name: 'Base Theme',
      baseThemeKey: undefined,
      themeKey: 'default-dark',
      styleContent: '',
    },
    custom: {
      name: 'Custom Theme',
      baseThemeKey: 'default-dark',
      themeKey: 'customTheme',
      styleContent: '',
    },
    customInvalid: {
      name: 'Custom Theme - Invalid Base',
      themeKey: 'customThemeInvalid',
      styleContent: '',
    },
  } satisfies Record<string, ThemeData>;

  const themeRegistration: ThemeRegistrationData = {
    base: [mockTheme.base],
    custom: [mockTheme.custom],
  };

  it.each([null, mockTheme.customInvalid])(
    'should throw if base theme not found',
    customTheme => {
      expect(() =>
        getActiveThemes(customTheme?.themeKey ?? 'mock.themeKey', {
          base: [],
          custom: customTheme == null ? [] : [customTheme],
        })
      ).toThrowError(`Default base theme 'default-dark' is not registered`);
    }
  );

  it('should return a base theme if given base theme key', () => {
    const actual = getActiveThemes(mockTheme.base.themeKey, themeRegistration);
    expect(actual).toEqual([mockTheme.base]);
  });

  it('should return a base + custom theme if given a custom theme key', () => {
    const actual = getActiveThemes(
      mockTheme.custom.themeKey,
      themeRegistration
    );
    expect(actual).toEqual([mockTheme.base, mockTheme.custom]);
  });
});

describe('getDefaultBaseThemes', () => {
  it('should return default base themes', () => {
    const actual = getDefaultBaseThemes();
    expect(actual).toEqual([
      {
        name: 'Default Dark',
        themeKey: 'default-dark',
        styleContent: 'test-file-stub',
      },
      {
        name: 'Default Light',
        themeKey: 'default-light',
        styleContent: 'test-file-stub',
      },
    ]);
  });
});

describe('getThemeKey', () => {
  it('should combine plugin name and theme name', () => {
    const actual = getThemeKey('plugin', 'name');
    expect(actual).toBe('plugin_name');
  });
});

describe('getThemePreloadData', () => {
  const mockPreload = {
    dataA: `{"themeKey":"aaa","preloadStyleContent":"':root{}"}`,
    dataB: `{"themeKey":"bbb","preloadStyleContent":"':root{}"}`,
    notParseable: '{',
  };

  it.each([
    [null, null],
    [mockPreload.notParseable, null],
    [mockPreload.dataA, JSON.parse(mockPreload.dataA)],
  ])(
    'should parse local storage value or return null: %s, %s',
    (localStorageValue, expected) => {
      jest
        .spyOn(Object.getPrototypeOf(localStorage), 'getItem')
        .mockName('getItem');

      if (localStorageValue != null) {
        localStorage.setItem(THEME_CACHE_LOCAL_STORAGE_KEY, localStorageValue);
      }

      const actual = getThemePreloadData();

      expect(localStorage.getItem).toHaveBeenCalledWith(
        THEME_CACHE_LOCAL_STORAGE_KEY
      );
      expect(actual).toEqual(expected);
    }
  );
});

describe('preloadTheme', () => {
  it.each([
    null,
    {
      themeKey: 'mock.themeKey',
      preloadStyleContent: ':root{mock.preloadStyleContent}',
    },
  ] as const)('should set the style content: %s', preloadData => {
    if (preloadData != null) {
      localStorage.setItem(
        THEME_CACHE_LOCAL_STORAGE_KEY,
        JSON.stringify(preloadData)
      );
    }

    preloadTheme();

    const styleEl = document.querySelector('style');

    expect(styleEl).not.toBeNull();
    expect(styleEl?.innerHTML).toEqual(
      preloadData?.preloadStyleContent ?? calculatePreloadStyleContent()
    );
  });
});

describe('setThemePreloadData', () => {
  it('should set the theme preload data', () => {
    const preloadData = {
      themeKey: 'mock.themeKey',
      preloadStyleContent: ':root{mock.preloadStyleContent}',
    } as const;

    setThemePreloadData(preloadData);

    expect(localStorage.getItem(THEME_CACHE_LOCAL_STORAGE_KEY)).toEqual(
      JSON.stringify(preloadData)
    );
  });
});
