import { TestUtils } from '@deephaven/utils';
import {
  DEFAULT_PRELOAD_DATA_VARIABLES,
  ThemeData,
  ThemeRegistrationData,
  THEME_CACHE_LOCAL_STORAGE_KEY,
} from './ThemeModel';
import {
  asRgbOrRgbaString,
  calculatePreloadStyleContent,
  getActiveThemes,
  getDefaultBaseThemes,
  getThemeKey,
  getThemePreloadData,
  normalizeCssColor,
  parseRgba,
  preloadTheme,
  rgbaToHex8,
  setThemePreloadData,
} from './ThemeUtils';

const { createMockProxy } = TestUtils;

const getBackgroundColor = jest.fn();
const setBackgroundColor = jest.fn();

const mockDivEl = createMockProxy<HTMLDivElement>({
  style: {
    get backgroundColor(): string {
      return getBackgroundColor();
    },
    set backgroundColor(value: string) {
      setBackgroundColor(value);
    },
  } as HTMLDivElement['style'],
});

const colorMap = [
  {
    hsl: { h: 0, s: 100, l: 50 },
    rgb: { r: 255, g: 0, b: 0 },
    hex: '#ff0000ff',
  },
  {
    hsl: { h: 30, s: 100, l: 50 },
    rgb: { r: 255, g: 128, b: 0 },
    hex: '#ff8000ff',
  },
  {
    hsl: { h: 60, s: 100, l: 50 },
    rgb: { r: 255, g: 255, b: 0 },
    hex: '#ffff00ff',
  },
  {
    hsl: { h: 90, s: 100, l: 50 },
    rgb: { r: 128, g: 255, b: 0 },
    hex: '#80ff00ff',
  },
  {
    hsl: { h: 120, s: 100, l: 50 },
    rgb: { r: 0, g: 255, b: 0 },
    hex: '#00ff00ff',
  },
  {
    hsl: { h: 150, s: 100, l: 50 },
    rgb: { r: 0, g: 255, b: 128 },
    hex: '#00ff80ff',
  },
  {
    hsl: { h: 180, s: 100, l: 50 },
    rgb: { r: 0, g: 255, b: 255 },
    hex: '#00ffffff',
  },
  {
    hsl: { h: 210, s: 100, l: 50 },
    rgb: { r: 0, g: 128, b: 255 },
    hex: '#0080ffff',
  },
  {
    hsl: { h: 240, s: 100, l: 50 },
    rgb: { r: 0, g: 0, b: 255 },
    hex: '#0000ffff',
  },
  {
    hsl: { h: 270, s: 100, l: 50 },
    rgb: { r: 128, g: 0, b: 255 },
    hex: '#8000ffff',
  },
  {
    hsl: { h: 300, s: 100, l: 50 },
    rgb: { r: 255, g: 0, b: 255 },
    hex: '#ff00ffff',
  },
  {
    hsl: { h: 330, s: 100, l: 50 },
    rgb: { r: 255, g: 0, b: 128 },
    hex: '#ff0080ff',
  },
];

beforeEach(() => {
  document.body.removeAttribute('style');
  document.head.innerHTML = '';
  localStorage.clear();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  expect.hasAssertions();

  getBackgroundColor.mockName('getBackgroundColor');
  setBackgroundColor.mockName('setBackgroundColor');
});

describe('asRgbOrRgbaString', () => {
  beforeEach(() => {
    jest
      .spyOn(document, 'createElement')
      .mockName('createElement')
      .mockReturnValue(mockDivEl);
  });

  it('should return resolved backgroundColor value', () => {
    getBackgroundColor.mockReturnValue('get backgroundColor');

    const actual = asRgbOrRgbaString('red');
    expect(actual).toEqual('get backgroundColor');
  });

  it('should return null if backgroundColor resolves to empty string', () => {
    getBackgroundColor.mockReturnValue('');

    const actual = asRgbOrRgbaString('red');
    expect(actual).toBeNull();
  });
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

describe('normalizeCssColor', () => {
  beforeEach(() => {
    jest
      .spyOn(document, 'createElement')
      .mockName('createElement')
      .mockReturnValue(mockDivEl);
  });

  it.each([
    'rgb(0, 128, 255)',
    'rgba(0, 128, 255, 64)',
    'rgb(0 128 255)',
    'rgba(0 128 255 64)',
  ])(
    'should normalize a resolved rgb/a color to 8 character hex value',
    rgbOrRgbaColor => {
      getBackgroundColor.mockReturnValue(rgbOrRgbaColor);

      const actual = normalizeCssColor('some.color');
      expect(actual).toEqual(rgbaToHex8(parseRgba(rgbOrRgbaColor)!));
    }
  );

  it('should return original color if backgroundColor resolves to empty string', () => {
    getBackgroundColor.mockReturnValue('');

    const actual = normalizeCssColor('red');
    expect(actual).toEqual('red');
  });

  it('should return original color if backgroundColor resolves to non rgb/a', () => {
    getBackgroundColor.mockReturnValue('xxx');

    const actual = normalizeCssColor('red');
    expect(actual).toEqual('red');
  });
});

describe('parseRgba', () => {
  it.only.each([
    ['rgb(255, 255, 255)', { r: 255, g: 255, b: 255, a: 1 }],
    ['rgb(0,0,0)', { r: 0, g: 0, b: 0, a: 1 }],
    ['rgb(255 255 255)', { r: 255, g: 255, b: 255, a: 1 }],
    ['rgb(0 0 0)', { r: 0, g: 0, b: 0, a: 1 }],
    ['rgb(0 128 255)', { r: 0, g: 128, b: 255, a: 1 }],
    ['rgb(0 128 255 / .5)', { r: 0, g: 128, b: 255, a: 0.5 }],
  ])('should parse rgb: %s, %s', (rgb, hex) => {
    expect(parseRgba(rgb)).toEqual(hex);
  });

  it.each([
    ['rgba(255, 255, 255, 1)', { r: 255, g: 255, b: 255, a: 1 }],
    ['rgba(0,0,0,0)', { r: 0, g: 0, b: 0, a: 0 }],
    ['rgba(255 255 255 1)', { r: 255, g: 255, b: 255, a: 1 }],
    ['rgba(0 0 0 0)', { r: 0, g: 0, b: 0, a: 0 }],
    ['rgba(0 128 255 .5)', { r: 0, g: 128, b: 255, a: 0.5 }],
  ])('should parse rgba: %s, %s', (rgba, hex) => {
    expect(parseRgba(rgba)).toEqual(hex);
  });
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

describe('rgbaToHex8', () => {
  it.each(colorMap)('should convert rgb to hex: %s, %s', ({ rgb, hex }) => {
    expect(rgbaToHex8(rgb)).toEqual(hex);
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
