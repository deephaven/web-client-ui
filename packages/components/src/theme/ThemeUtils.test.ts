import { ColorUtils, TestUtils } from '@deephaven/utils';
import shortid from 'shortid';
import {
  DEFAULT_DARK_THEME_KEY,
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
  replaceCssVariablesWithResolvedValues,
  setThemePreloadData,
} from './ThemeUtils';

jest.mock('shortid');

const { asMock, createMockProxy } = TestUtils;

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
      `:root{--dh-color-accent:${DEFAULT_PRELOAD_DATA_VARIABLES['--dh-color-accent']};--dh-color-background:${DEFAULT_PRELOAD_DATA_VARIABLES['--dh-color-background']}}`
    );
  });

  it('should resolve css variables', () => {
    document.body.style.setProperty('--dh-color-accent', 'pink');
    document.body.style.setProperty('--dh-color-background', 'orange');

    expect(calculatePreloadStyleContent()).toEqual(
      ':root{--dh-color-accent:pink;--dh-color-background:orange}'
    );
  });
});

describe('getActiveThemes', () => {
  const mockTheme = {
    default: {
      name: 'Default Theme',
      baseThemeKey: undefined,
      themeKey: DEFAULT_DARK_THEME_KEY,
      styleContent: '',
    },
    base: {
      name: 'Base Theme',
      baseThemeKey: undefined,
      themeKey: 'default-light',
      styleContent: '',
    },
    custom: {
      name: 'Custom Theme',
      baseThemeKey: 'default-light',
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
    base: [mockTheme.default, mockTheme.base],
    custom: [mockTheme.custom],
  };

  it('should use default dark theme if no base theme is matched', () => {
    const actual = getActiveThemes('somekey', themeRegistration);
    expect(actual).toEqual([mockTheme.default]);
  });

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
        styleContent: 'test-file-stub\ntest-file-stub',
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

describe.each([undefined, document.createElement('div')])(
  'replaceCssVariablesWithResolvedValues',
  targetElement => {
    const mockShortId = 'mockShortId';
    const computedStyle = createMockProxy<CSSStyleDeclaration>();
    const expectedEl = targetElement ?? document.body;

    beforeEach(() => {
      asMock(shortid).mockName('shortid').mockReturnValue(mockShortId);
      asMock(computedStyle.getPropertyValue)
        .mockName('getPropertyValue')
        .mockImplementation(key => `resolved-${key}`);

      jest.spyOn(expectedEl.style, 'setProperty').mockName('setProperty');
      jest.spyOn(expectedEl.style, 'removeProperty').mockName('removeProperty');

      jest
        .spyOn(ColorUtils, 'normalizeCssColor')
        .mockName('normalizeCssColor')
        .mockImplementation(key => `normalized-${key}`);
      jest
        .spyOn(window, 'getComputedStyle')
        .mockName('getComputedStyle')
        .mockReturnValue(computedStyle);
    });

    it('should map non-css variable values verbatim', () => {
      const given = {
        aaa: 'aaa',
        bbb: 'bbb',
      };

      const actual = replaceCssVariablesWithResolvedValues(
        given,
        targetElement
      );

      expect(computedStyle.getPropertyValue).not.toHaveBeenCalled();
      expect(ColorUtils.normalizeCssColor).not.toHaveBeenCalled();
      expect(actual).toEqual(given);
    });

    it('should replace css variables with resolved values', () => {
      const given = {
        aaa: 'var(--aaa)',
        bbb: 'var(--bbb1) var(--bbb2)',
      };

      const expected = {
        aaa: 'normalized-resolved---mockShortId-aaa',
        bbb: 'normalized-resolved---mockShortId-bbb',
      };

      const actual = replaceCssVariablesWithResolvedValues(
        given,
        targetElement
      );

      Object.keys(given).forEach(key => {
        const tmpKey = `--${mockShortId}-${key}`;

        expect(expectedEl.style.setProperty).toHaveBeenCalledWith(
          tmpKey,
          given[key]
        );

        expect(computedStyle.getPropertyValue).toHaveBeenCalledWith(tmpKey);
        expect(expectedEl.style.removeProperty).toHaveBeenCalledWith(tmpKey);
        expect(ColorUtils.normalizeCssColor).toHaveBeenCalledWith(
          `resolved-${tmpKey}`
        );
      });

      expect(actual).toEqual(expected);
    });
  }
);

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
