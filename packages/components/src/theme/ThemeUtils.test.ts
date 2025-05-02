import fs from 'fs';
import path from 'path';

import { ColorUtils, requestParentResponse } from '@deephaven/utils';
import { TestUtils } from '@deephaven/test-utils';
import {
  DEFAULT_DARK_THEME_KEY,
  DEFAULT_PRELOAD_DATA_VARIABLES,
  SVG_ICON_MANUAL_COLOR_MAP,
  type ThemeData,
  type ThemePreloadColorVariable,
  type ThemeRegistrationData,
  THEME_CACHE_LOCAL_STORAGE_KEY,
  THEME_KEY_OVERRIDE_QUERY_PARAM,
  type ParentThemeData,
  PARENT_THEME_KEY,
  type BaseThemeKey,
  PRELOAD_TRANSPARENT_THEME_QUERY_PARAM,
  DEFAULT_LIGHT_THEME_KEY,
  TRANSPARENT_PRELOAD_DATA_VARIABLES,
} from './ThemeModel';
import {
  calculatePreloadStyleContent,
  createCssVariableResolver,
  extractDistinctCssVariableExpressions,
  getActiveThemes,
  getDefaultBaseThemes,
  getDefaultSelectedThemeKey,
  getExpressionRanges,
  getThemeKey,
  getThemePreloadData,
  isBaseThemeKey,
  isParentThemeData,
  isParentThemeEnabled,
  isPreloadTransparentTheme,
  isValidColorVar,
  overrideSVGFillColors,
  parseParentThemeData,
  preloadTheme,
  replaceSVGFillColor,
  requestParentThemeData,
  resolveCssVariablesInRecord,
  resolveCssVariablesInString,
  setThemePreloadData,
  TMP_CSS_PROP_PREFIX,
} from './ThemeUtils';

jest.mock('@deephaven/utils', () => ({
  ...jest.requireActual('@deephaven/utils'),
  requestParentResponse: jest.fn(),
}));
jest.mock('nanoid');

const { asMock, createMockProxy } = TestUtils;

const VALID_COLOR1 = 'mock.validColor1';
const VALID_COLOR2 = 'mock.validColor2';
const INVALID_COLOR = 'mock.invalidColor';
const MOCK_VALID_COLOR_VALUE = new Set([VALID_COLOR1, VALID_COLOR2]);

/** Mock CSS.supports implementation including overload signatures. */
function mockCssSupports(property: string, value: string): boolean;
function mockCssSupports(conditionText: string): boolean;
function mockCssSupports(arg1: string, arg2?: string): boolean {
  return arg1 === 'color' && arg2 != null && MOCK_VALID_COLOR_VALUE.has(arg2);
}

const origLocation = window.location;

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  delete window.location;
  window.location = {
    search: '',
  } as unknown as Location;

  document.body.removeAttribute('style');
  document.head.innerHTML = '';
  localStorage.clear();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  expect.hasAssertions();
});

afterEach(() => {
  window.location = origLocation;
});

describe('DEFAULT_PRELOAD_DATA_VARIABLES', () => {
  it('should match snapshot', () => {
    expect(DEFAULT_PRELOAD_DATA_VARIABLES).toMatchSnapshot();
  });
});

describe('SVG_ICON_MANUAL_COLOR_MAP', () => {
  it('should match snapshot', () => {
    expect(SVG_ICON_MANUAL_COLOR_MAP).toMatchSnapshot();
  });
});

describe('calculatePreloadStyleContent', () => {
  function expectedContent(map: Record<string, string>) {
    return `:root{${Object.entries(map)
      .map(([key, value]) => `${key}:${value}`)
      .join(';')}}`;
  }

  it('should set defaults if css variables are not defined', () => {
    expect(
      calculatePreloadStyleContent(DEFAULT_PRELOAD_DATA_VARIABLES)
    ).toEqual(expectedContent(DEFAULT_PRELOAD_DATA_VARIABLES));
  });

  it('should resolve css variables', () => {
    document.body.style.setProperty(
      '--dh-color-loading-spinner-primary',
      'pink'
    );
    document.body.style.setProperty('--dh-color-bg', 'orange');

    expect(
      calculatePreloadStyleContent(DEFAULT_PRELOAD_DATA_VARIABLES)
    ).toEqual(
      expectedContent({
        ...DEFAULT_PRELOAD_DATA_VARIABLES,
        '--dh-color-loading-spinner-primary': 'pink',
        '--dh-color-bg': 'orange',
      })
    );
  });
});

describe('isBaseThemeKey', () => {
  it.each([
    [DEFAULT_DARK_THEME_KEY, true],
    [DEFAULT_LIGHT_THEME_KEY, true],
    ['some-theme', false],
    ['', false],
  ])(
    `should return true only for base theme keys: '%s'`,
    (themeKey, expected) => {
      expect(isBaseThemeKey(themeKey)).toBe(expected);
    }
  );
});

describe('isParentThemeData', () => {
  it.each([
    [{ name: 'Mock parent theme', cssVars: {} }, true],
    [null, false],
    [undefined, false],
    [{}, false],
    ['not-theme-data', false],
    [{ name: 'Mock parent theme', cssVars: 'cssVars' }, false],
    [{ name: 999, cssVars: {} }, false],
  ])(
    'should return true if parent theme data: %s',
    (maybeParentThemeData, expected) => {
      expect(isParentThemeData(maybeParentThemeData)).toBe(expected);
    }
  );
});

describe('isParentThemeEnabled', () => {
  it.each([
    [PARENT_THEME_KEY, true],
    [null, false],
    ['some-theme', false],
  ])(
    'should return true if parent theme is enabled: %s',
    (themeKey, expected) => {
      window.location.search =
        themeKey == null ? '' : `${THEME_KEY_OVERRIDE_QUERY_PARAM}=${themeKey}`;
      expect(isParentThemeEnabled()).toBe(expected);
    }
  );
});

describe('isPreloadTransparentTheme: %s', () => {
  it.each([
    ['true', true],
    ['false', false],
    [null, false],
  ])('should', (value, expected) => {
    window.location.search =
      value == null ? '' : `${PRELOAD_TRANSPARENT_THEME_QUERY_PARAM}=${value}`;
    expect(isPreloadTransparentTheme()).toBe(expected);
  });
});

describe('isValidColorVar', () => {
  it.each([
    ['--dh-color-bg', VALID_COLOR1, true],
    ['--dh-colorxx-bg', VALID_COLOR1, false],
    ['--dh-color-bg', INVALID_COLOR, false],
  ])(
    'should return true if name and value are valid: name:%s, value:%s',
    (name, value, expected) => {
      jest.spyOn(window.CSS, 'supports').mockImplementation(mockCssSupports);
      expect(isValidColorVar(name, value)).toBe(expected);
    }
  );
});

describe('parseParentThemeData', () => {
  it.each([
    [
      {
        baseThemeKey: 'mock.baseThemeKey' as BaseThemeKey,
        name: 'Mock parent theme',
        cssVars: {},
      },
      '',
    ],
    [
      {
        baseThemeKey: 'mock.baseThemeKey' as BaseThemeKey,
        name: 'Mock parent theme',
        cssVars: {
          '--dh-color-fg': INVALID_COLOR,
        },
      },
      '',
    ],
    [
      {
        baseThemeKey: 'mock.baseThemeKey' as BaseThemeKey,
        name: 'Mock parent theme',
        cssVars: {
          '--dh-color-bg': VALID_COLOR1,
          '--dh-color-fg': INVALID_COLOR,
          '--dh-colorxx-bg': VALID_COLOR1,
        } as ParentThemeData['cssVars'],
      },
      ':root{--dh-color-bg:mock.validColor1;}',
    ],
  ])(
    'should sanitize css vars: %s',
    (parentThemeData, expectedStyleContent) => {
      jest.spyOn(window.CSS, 'supports').mockImplementation(mockCssSupports);

      const actual = parseParentThemeData(parentThemeData);

      expect(actual).toEqual({
        name: parentThemeData.name,
        baseThemeKey: parentThemeData.baseThemeKey,
        themeKey: PARENT_THEME_KEY,
        styleContent: expectedStyleContent,
      });
    }
  );
});

describe('requestParentThemeData', () => {
  const mockParentThemeData: ParentThemeData = {
    name: 'Mock parent theme',
    cssVars: {
      '--dh-color-bg': 'blue',
    },
  };

  it('should throw if non-theme data is returned', () => {
    asMock(requestParentResponse).mockResolvedValue({
      label: 'not-theme-data',
    });

    expect(requestParentThemeData()).rejects.toThrowError(
      'Unexpected parent theme data response: {"label":"not-theme-data"}'
    );
  });

  it('should return theme data from parent', async () => {
    asMock(requestParentResponse).mockResolvedValue(mockParentThemeData);
    expect(await requestParentThemeData()).toEqual(mockParentThemeData);
  });
});

describe.each([document.body, document.createElement('div')])(
  'resolveCssVariablesInRecord: %s',
  targetElement => {
    const computedStyle = createMockProxy<CSSStyleDeclaration>();

    beforeEach(() => {
      jest
        .spyOn(window, 'getComputedStyle')
        .mockName('getComputedStyle')
        .mockReturnValue(computedStyle);
    });

    it('should return empty string if property does not exist and no default value exists', () => {
      asMock(computedStyle.getPropertyValue).mockReturnValue('');

      const resolver = createCssVariableResolver(
        targetElement,
        DEFAULT_PRELOAD_DATA_VARIABLES
      );

      expect(getComputedStyle).toHaveBeenCalledWith(targetElement);

      expect(resolver('--dh-aaa')).toEqual('');
    });

    it.each(
      Object.entries(DEFAULT_PRELOAD_DATA_VARIABLES) as [
        ThemePreloadColorVariable,
        string,
      ][]
    )(
      'should return default value if property does not exist and default value exists: %s, %s',
      (key, value) => {
        asMock(computedStyle.getPropertyValue).mockReturnValue('');

        const resolver = createCssVariableResolver(
          targetElement,
          DEFAULT_PRELOAD_DATA_VARIABLES
        );

        expect(getComputedStyle).toHaveBeenCalledWith(targetElement);

        expect(resolver(key)).toEqual(value);
      }
    );

    it('should return a resolver function that resolves css variables', () => {
      asMock(computedStyle.getPropertyValue).mockImplementation(
        name => `resolved:${name}`
      );

      const resolver = createCssVariableResolver(
        targetElement,
        DEFAULT_PRELOAD_DATA_VARIABLES
      );

      expect(getComputedStyle).toHaveBeenCalledWith(targetElement);

      const actual = resolver('--dh-aaa');

      expect(computedStyle.getPropertyValue).toHaveBeenCalledWith('--dh-aaa');
      expect(actual).toEqual('resolved:--dh-aaa');
    });
  }
);

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

describe('getDefaultSelectedThemeKey', () => {
  it.each([
    ['overrideKey', 'preloadKey', 'overrideKey'],
    [undefined, 'preloadKey', 'preloadKey'],
    [undefined, undefined, DEFAULT_DARK_THEME_KEY],
  ])(
    'should coalesce overide key -> preload key -> default key: %s, %s, %s',
    (overrideKey, preloadKey, expected) => {
      if (overrideKey != null) {
        window.location.search = `?${THEME_KEY_OVERRIDE_QUERY_PARAM}=${overrideKey}`;
      }

      localStorage.setItem(
        THEME_CACHE_LOCAL_STORAGE_KEY,
        JSON.stringify({ themeKey: preloadKey })
      );

      const actual = getDefaultSelectedThemeKey();
      expect(actual).toEqual(expected);
    }
  );
});

describe('getExpressionRanges', () => {
  const testCases = [
    ['Single expression', '#ffffff', [[0, 6]]],
    ['Single var expression', 'var(--aaa-aa)', [[0, 12]]],
    [
      'Multiple expressions',
      '#ffffff #ffffff',
      [
        [0, 6],
        [8, 14],
      ],
    ],
    [
      'Multiple var expressions',
      'var(--aaa-aa) var(--bbb-bb)',
      [
        [0, 12],
        [14, 26],
      ],
    ],
    [
      'Mixed expressions',
      ' var(--aaa-aa)\n   #fff \n\n var(--bbb-bb)  \n  ',
      [
        [1, 13],
        [18, 21],
        [26, 38],
      ],
    ],
    [
      'Nested expressions - level 2',
      'var(--ccc-cc, var(--aaa-aa, green)) var(--bbb-bb)',
      [
        [0, 34],
        [36, 48],
      ],
    ],
    [
      'Nested expressions - level 3',
      'var(--a, var(--b, var(--c, red)))',
      [[0, 32]],
    ],
    [
      'Nested expressions - level 4',
      'var(--a, var(--b, \n var(--c, var(--d, red)))) \n\t\n var(--e, var(--f, var(--g, var(--h, red))))   \n  \t',
      [
        [0, 44],
        [50, 92],
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

  it.each(testCases)(
    'should return top-level expression ranges: %s, %s',
    (_, given, expected) => {
      expect(getExpressionRanges(given)).toEqual(expected);
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
        styleContent: [
          './theme-dark-palette.css?raw',
          './theme-dark-semantic.css?raw',
          './theme-dark-semantic-chart.css?raw',
          './theme-dark-semantic-editor.css?raw',
          './theme-dark-semantic-grid.css?raw',
          './theme-dark-components.css?raw',
        ].join('\n'),
      },
      {
        name: 'Default Light',
        themeKey: 'default-light',
        styleContent: [
          './theme-light-palette.css?raw',
          './theme-light-semantic.css?raw',
          './theme-light-semantic-chart.css?raw',
          './theme-light-semantic-editor.css?raw',
          './theme-light-semantic-grid.css?raw',
          './theme-light-components.css?raw',
        ].join('\n'),
      },
    ]);
  });

  /**
   * This test is to ensure that the css variables in theme-dark and theme-light are in sync,
   * to prevent the case where a css variable is added to one theme and not the other.
   */
  it('should contain the same css variables between light and dark themes', () => {
    const themeDarkDir = './packages/components/src/theme/theme-dark';
    const themeLightDir = './packages/components/src/theme/theme-light';

    function extractCssVariablesFromFiles(directory: string): Set<string>[] {
      const files = fs.readdirSync(directory);
      const fileVariables: Set<string>[] = [];
      files.forEach(file => {
        const variables = new Set<string>();
        const filePath = path.join(directory, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        // strip comments as they may contain css variable names
        const fileContentsNoComments = fileContent.replace(
          /\/\*[\s\S]*?\*\//g,
          ''
        );
        const lines = fileContentsNoComments.split('\n');
        // extract css variables from each line, before the colon
        const matches = lines.map(line => /(--[a-zA-Z-]+):/.exec(line)?.[1]);
        matches?.forEach(match => {
          if (match != null) variables.add(match as string);
        });
        fileVariables.push(new Set([...variables].sort())); // sort is just for readability
      });
      return fileVariables;
    }

    const darkCssVariables = extractCssVariablesFromFiles(themeDarkDir);
    const lightCssVariables = extractCssVariablesFromFiles(themeLightDir);
    expect(darkCssVariables.length).toEqual(lightCssVariables.length);

    for (let i = 0; i < darkCssVariables.length; i += 1) {
      // expect each set to be equal
      expect(darkCssVariables[i]).toEqual(lightCssVariables[i]);
    }
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

describe('overrideSVGFillColors', () => {
  const computedStyle = createMockProxy<CSSStyleDeclaration>();

  beforeEach(() => {
    jest
      .spyOn(window, 'getComputedStyle')
      .mockName('getComputedStyle')
      .mockReturnValue(computedStyle);

    jest.spyOn(document.body.style, 'setProperty').mockName('setProperty');
    jest
      .spyOn(document.body.style, 'removeProperty')
      .mockName('removeProperty');
  });

  it.each(Object.entries(SVG_ICON_MANUAL_COLOR_MAP))(
    'should replace fill colors in svgs: %s, %s',
    (key, value) => {
      asMock(computedStyle.getPropertyValue).mockImplementation(propertyKey =>
        propertyKey.startsWith('--dh-svg-icon-')
          ? `blah fill='currentColor' bleh`
          : 'red'
      );

      overrideSVGFillColors(DEFAULT_PRELOAD_DATA_VARIABLES);

      expect(getComputedStyle).toHaveBeenCalledWith(document.body);
      expect(document.body.style.removeProperty).toHaveBeenCalledWith(key);
      expect(computedStyle.getPropertyValue).toHaveBeenCalledWith(key);
      expect(computedStyle.getPropertyValue).toHaveBeenCalledWith(value);
      expect(document.body.style.setProperty).toHaveBeenCalledWith(
        key,
        `blah fill='red' bleh`
      );
    }
  );
});

describe('preloadTheme', () => {
  it.each([
    [null, true],
    [null, false],
    [
      {
        themeKey: 'mock.themeKey',
        preloadStyleContent: ':root{mock.preloadStyleContent}',
      },
      false,
    ],
  ] as const)(
    'should set the style content: %s',
    (preloadData, preloadTransparent) => {
      if (preloadData != null) {
        localStorage.setItem(
          THEME_CACHE_LOCAL_STORAGE_KEY,
          JSON.stringify(preloadData)
        );
      }

      if (preloadTransparent) {
        window.location.search = `${PRELOAD_TRANSPARENT_THEME_QUERY_PARAM}=true`;
      }

      preloadTheme();

      const [styleElDefaults, styleElPrevious] =
        document.querySelectorAll('style');

      expect(styleElDefaults).not.toBeNull();

      expect(styleElDefaults?.innerHTML).toEqual(
        calculatePreloadStyleContent(
          preloadTransparent
            ? TRANSPARENT_PRELOAD_DATA_VARIABLES
            : DEFAULT_PRELOAD_DATA_VARIABLES
        )
      );

      if (preloadData?.preloadStyleContent == null) {
        expect(styleElPrevious).toBeUndefined();
      } else {
        expect(styleElPrevious).toBeDefined();
        expect(styleElPrevious?.innerHTML).toEqual(
          preloadData?.preloadStyleContent
        );
      }
    }
  );
});

describe('replaceSVGFillColor', () => {
  function svgContent(color: string) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='${color}' d='M193.94 256L296.5 256z'/%3E%3C/svg%3E`;
  }

  it.each([
    ['#ababab', '%23ababab'],
    ['hsl(222deg, 50%, 42%)', 'hsl(222deg%2C%2050%25%2C%2042%25)'],
  ] as const)(
    'should replace fill color: %s, %s',
    (givenColor, expectedColor) => {
      const givenSvg = svgContent(givenColor);
      const expectedSvg = svgContent(expectedColor);

      const actual = replaceSVGFillColor(givenSvg, givenColor);
      expect(actual).toEqual(expectedSvg);
    }
  );
});

describe.each([undefined, document.createElement('div')])(
  'resolveCssVariablesInRecord',
  targetElement => {
    const computedStyle = createMockProxy<CSSStyleDeclaration>();
    const expectedTargetEl = targetElement ?? document.body;
    const tmpPropEl = createMockProxy<HTMLDivElement>({
      style: {
        setProperty: jest.fn(),
        removeProperty: jest.fn(),
      } as unknown as CSSStyleDeclaration,
      appendChild: jest.fn(),
      remove: jest.fn(),
    });

    beforeEach(() => {
      asMock(computedStyle.getPropertyValue)
        .mockName('getPropertyValue')
        .mockImplementation(key => `resolved:${key}`);

      jest
        .spyOn(window, 'getComputedStyle')
        .mockName('getComputedStyle')
        .mockReturnValue(computedStyle);

      jest
        .spyOn(expectedTargetEl, 'appendChild')
        .mockName('appendChild')
        .mockReturnValue(tmpPropEl);

      jest
        .spyOn(document, 'createElement')
        .mockName('createElement')
        .mockReturnValue(tmpPropEl);

      jest
        .spyOn(ColorUtils, 'normalizeCssColor')
        .mockName('normalizeCssColor')
        .mockImplementation(key => `normalized:${key}`);
    });

    it('should map non-css variable values verbatim', () => {
      const given = {
        aaa: 'aaa',
        bbb: 'bbb',
      };

      jest.spyOn(window.CSS, 'supports').mockReturnValue(false);

      const actual = resolveCssVariablesInRecord(given, targetElement);

      expect(ColorUtils.normalizeCssColor).not.toHaveBeenCalled();
      expect(actual).toEqual(given);
    });

    it.each([undefined, true, false])(
      'should replace css variables with resolved values: isAlphaOptional',
      isAlphaOptional => {
        const given = {
          aaa: 'var(--aaa)',
          bbb: 'var(--bbb1)',
        };

        const expected = {
          aaa: 'normalized:resolved:background-color',
          bbb: 'normalized:resolved:background-color',
        };

        const actual = resolveCssVariablesInRecord(
          given,
          targetElement,
          isAlphaOptional
        );

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
              `resolved:background-color`,
              isAlphaOptional ?? false
            );
          });
        });
      }
    );
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
    ['Empty string', '', ''],
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
      'R[calc(var(--a, calc(calc(calc(1px + 2px) + 3px))))] R[var(--b)]',
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
