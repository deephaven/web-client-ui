import { ColorUtils, TestUtils } from '@deephaven/utils';
import {
  DEFAULT_DARK_THEME_KEY,
  DEFAULT_PRELOAD_DATA_VARIABLES,
  ThemeData,
  ThemeRegistrationData,
  THEME_CACHE_LOCAL_STORAGE_KEY,
} from './ThemeModel';
import {
  calculatePreloadStyleContent,
  extractDistinctCssVariableExpressions,
  getActiveThemes,
  getCssVariableRanges,
  getDefaultBaseThemes,
  getThemeKey,
  getThemePreloadData,
  preloadTheme,
  resolveCssVariablesInRecord,
  resolveCssVariablesInString,
  setThemePreloadData,
  TMP_CSS_PROP_PREFIX,
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

describe('extractDistinctCssVariableExpressions', () => {
  it('should extract distinct css variable expressions', () => {
    const given = {
      aaa: 'var(--aaa-aa)',
      bbb: 'var(--bbb-bb)',
      ccc: 'var(--ccc-cc)',
      ddd: 'var(--aaa-aa)',
      eee: 'var(--bbb-bb)',
      fff: 'xxx',
      ggg: 'xxx var(--gg-ggg) yyy',
    };

    const actual = extractDistinctCssVariableExpressions(given);
    expect(actual).toEqual(
      new Set([
        'var(--aaa-aa)',
        'var(--bbb-bb)',
        'var(--ccc-cc)',
        'var(--gg-ggg)',
      ])
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

describe('getCssVariableRanges', () => {
  const t = [
    ['Single var', 'var(--aaa-aa)', [[0, 12]]],
    [
      'Multiple vars',
      'var(--aaa-aa) var(--bbb-bb)',
      [
        [0, 12],
        [14, 26],
      ],
    ],
    [
      'Nested vars - level 2',
      'var(--ccc-cc, var(--aaa-aa, green)) var(--bbb-bb)',
      [
        [0, 34],
        [36, 48],
      ],
    ],
    ['Nested vars - level 3', 'var(--a, var(--b, var(--c, red)))', [[0, 32]]],
    [
      'Nested vars - level 4',
      'var(--a, var(--b, var(--c, var(--d, red)))) var(--e, var(--f, var(--g, var(--h, red))))',
      [
        [0, 42],
        [44, 86],
      ],
    ],
    ['Nested calc - level 3', 'var(--a, calc(calc(1px + 2px)))', [[0, 30]]],
    [
      'Nested calc - level 4',
      'var(--a, calc(calc(calc(1px + 2px) + 3px)))',
      [[0, 42]],
    ],
    ['Unbalanced', 'var(--a', []],
  ] as const;

  it.each(t)(
    'should return the css variable ranges - %s: %s, %s',
    (_label, given, expected) => {
      const actual = getCssVariableRanges(given);
      expect(actual).toEqual(expected);
    }
  );
});

describe('getDefaultBaseThemes', () => {
  it('should return default base themes', () => {
    const actual = getDefaultBaseThemes();
    expect(actual).toEqual([
      {
        name: 'Default Dark',
        themeKey: 'default-dark',
        styleContent: 'test-file-stub\ntest-file-stub\ntest-file-stub',
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
  'resolveCssVariablesInRecord',
  targetElement => {
    const computedStyle = createMockProxy<CSSStyleDeclaration>();
    const expectedTargetEl = targetElement ?? document.body;
    const tmpPropEl = document.createElement('div');

    beforeEach(() => {
      asMock(computedStyle.getPropertyValue)
        .mockName('getPropertyValue')
        .mockImplementation(key => `resolved:${key}`);

      jest.spyOn(expectedTargetEl, 'appendChild').mockName('appendChild');

      jest
        .spyOn(document, 'createElement')
        .mockName('createElement')
        .mockReturnValue(tmpPropEl);

      jest.spyOn(tmpPropEl.style, 'setProperty').mockName('setProperty');
      jest.spyOn(tmpPropEl.style, 'removeProperty').mockName('removeProperty');
      jest.spyOn(tmpPropEl, 'remove').mockName('remove');

      jest
        .spyOn(ColorUtils, 'normalizeCssColor')
        .mockName('normalizeCssColor')
        .mockImplementation(key => `normalized:${key}`);
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

      const actual = resolveCssVariablesInRecord(given, targetElement);

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
        aaa: 'normalized:resolved:--dh-tmp-0',
        bbb: 'normalized:resolved:--dh-tmp-1 normalized:resolved:--dh-tmp-2',
      };

      const actual = resolveCssVariablesInRecord(given, targetElement);

      expect(expectedTargetEl.appendChild).toHaveBeenCalledWith(tmpPropEl);
      expect(tmpPropEl.remove).toHaveBeenCalled();
      expect(actual).toEqual(expected);

      let i = 0;

      Object.keys(given).forEach(key => {
        const varExpressions = given[key].split(' ');
        varExpressions.forEach(value => {
          const tmpPropKey = `--${TMP_CSS_PROP_PREFIX}-${i}`;
          i += 1;

          expect(tmpPropEl.style.setProperty).toHaveBeenCalledWith(
            tmpPropKey,
            value
          );
          expect(computedStyle.getPropertyValue).toHaveBeenCalledWith(
            tmpPropKey
          );
          expect(ColorUtils.normalizeCssColor).toHaveBeenCalledWith(
            `resolved:${tmpPropKey}`
          );
        });
      });
    });
  }
);

describe('resolveCssVariablesInString', () => {
  const mockResolver = jest.fn();

  beforeEach(() => {
    mockResolver
      .mockName('mockResolver')
      .mockImplementation(varExpression => `R[${varExpression}]`);
  });

  it.each([
    ['No vars', 'red', 'red'],
    ['Single var', 'var(--aaa-aa)', 'R[var(--aaa-aa)]'],
    [
      'Multiple vars',
      'var(--aaa-aa) var(--bbb-bb)',
      'R[var(--aaa-aa)] R[var(--bbb-bb)]',
    ],
    [
      'Nested vars - level 2',
      'var(--ccc-cc, var(--aaa-aa, green)) var(--bbb-bb)',
      'R[var(--ccc-cc, var(--aaa-aa, green))] R[var(--bbb-bb)]',
    ],
    [
      'Nested vars - level 3',
      'var(--a, var(--b, var(--c, red)))',
      'R[var(--a, var(--b, var(--c, red)))]',
    ],
    [
      'Nested vars - level 4',
      'var(--a, var(--b, var(--c, var(--d, red))))',
      'R[var(--a, var(--b, var(--c, var(--d, red))))]',
    ],
    [
      'Nested calc - level 3',
      'var(--a, calc(calc(1px + 2px)))',
      'R[var(--a, calc(calc(1px + 2px)))]',
    ],
    [
      'Nested calc - level 4',
      'var(--a, calc(calc(calc(1px + 2px) + 3px)))',
      'R[var(--a, calc(calc(calc(1px + 2px) + 3px)))]',
    ],
    [
      'Nested calc - level 4',
      'var(--a, calc(calc(calc(1px + 2px) + 3px)))',
      'R[var(--a, calc(calc(calc(1px + 2px) + 3px)))]',
    ],
    [
      'Non top-level var',
      'calc(var(--a, calc(calc(calc(1px + 2px) + 3px)))) var(--b)',
      'calc(R[var(--a, calc(calc(calc(1px + 2px) + 3px)))]) R[var(--b)]',
    ],
  ])('should replace css variables - %s: %s, %s', (_label, given, expected) => {
    const actual = resolveCssVariablesInString(mockResolver, given);

    expect(actual).toEqual(expected);
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
