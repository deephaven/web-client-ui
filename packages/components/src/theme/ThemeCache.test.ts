import { TestUtils } from '@deephaven/utils';
import { ThemeCache } from './ThemeCache';
import {
  DEFAULT_DARK_THEME_KEY,
  ThemeData,
  ThemePreloadData,
} from './ThemeModel';

const { asMock } = TestUtils;

const MOCK_CACHE_LOCAL_STORAGE_KEY = 'mock-theme-cache';
let themeCache: ThemeCache;

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  expect.hasAssertions();

  jest
    .spyOn(Object.getPrototypeOf(localStorage), 'getItem')
    .mockName('getItem');
  jest
    .spyOn(Object.getPrototypeOf(localStorage), 'setItem')
    .mockName('setItem');

  themeCache = new ThemeCache(MOCK_CACHE_LOCAL_STORAGE_KEY);
  jest.spyOn(themeCache, 'getBaseTheme').mockName('getBaseTheme');
  jest.spyOn(themeCache, 'getCustomTheme').mockName('getCustomTheme');
  jest.spyOn(themeCache, 'onChange').mockName('onChange');
});

const mockPreload = {
  dataA: `{"themeKey":"aaa","preloadStyleContent":"':root{}"}`,
  dataB: `{"themeKey":"bbb","preloadStyleContent":"':root{}"}`,
  notParseable: '{',
};

const mockTheme = {
  noBase: {
    name: 'No Base',
    baseThemeKey: undefined,
    themeKey: 'themeNoBase',
    styleContent: '',
  },
  withBase: {
    name: 'With Base',
    baseThemeKey: 'default-light',
    themeKey: 'themeWithBase',
    styleContent: '',
  },
} satisfies Record<string, ThemeData>;

describe('getPreloadData', () => {
  it.each([
    [null, null],
    [mockPreload.notParseable, null],
    [mockPreload.dataA, JSON.parse(mockPreload.dataA)],
  ])(
    'should parse local storage value or return null: %s, %s',
    (localStorageValue, expected) => {
      asMock(localStorage.getItem).mockReturnValue(localStorageValue);

      const actual = themeCache.getPreloadData();

      expect(localStorage.getItem).toHaveBeenCalledWith(
        MOCK_CACHE_LOCAL_STORAGE_KEY
      );
      expect(actual).toEqual(expected);
    }
  );

  it('should cache the parsed value', () => {
    asMock(localStorage.getItem).mockReturnValue(mockPreload.dataA);

    const actualA1 = themeCache.getPreloadData();

    jest.clearAllMocks();

    const actualA2 = themeCache.getPreloadData();
    expect(localStorage.getItem).not.toHaveBeenCalled();
    expect(actualA1).toBe(actualA2);

    themeCache.setPreloadData(JSON.parse(mockPreload.dataB));
    const actualB2 = themeCache.getPreloadData();

    expect(localStorage.getItem).toHaveBeenCalledWith(
      MOCK_CACHE_LOCAL_STORAGE_KEY
    );
    expect(actualB2).toEqual(JSON.parse(mockPreload.dataB));
  });
});

describe('setPreloadData', () => {
  it.each([
    [JSON.parse(mockPreload.dataA), JSON.parse(mockPreload.dataA)],
    [JSON.parse(mockPreload.dataA), JSON.parse(mockPreload.dataB)],
  ] as [ThemePreloadData, ThemePreloadData][])(
    'should set the preload data in local storage if it has changed: %s, %s',
    (currentValue, newValue) => {
      asMock(localStorage.getItem).mockReturnValue(
        JSON.stringify(currentValue)
      );

      themeCache.setPreloadData(newValue);

      if (
        currentValue.themeKey === newValue.themeKey &&
        currentValue.preloadStyleContent === newValue.preloadStyleContent
      ) {
        expect(localStorage.setItem).not.toHaveBeenCalled();
        expect(themeCache.onChange).not.toHaveBeenCalled();
      } else {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          MOCK_CACHE_LOCAL_STORAGE_KEY,
          JSON.stringify(newValue)
        );
        expect(themeCache.onChange).toHaveBeenCalledTimes(1);
      }
    }
  );
});

describe('getAppliedThemes', () => {
  it.each([
    [mockTheme.noBase, null],
    [mockTheme.noBase, mockTheme.withBase],
  ])(
    'should return base theme followed by optional custom theme',
    (baseTheme, customTheme) => {
      asMock(themeCache.getBaseTheme).mockReturnValue(baseTheme);
      asMock(themeCache.getCustomTheme).mockReturnValue(customTheme);

      const actual = themeCache.getAppliedThemes();

      expect(actual).toEqual(
        customTheme == null ? [baseTheme] : [baseTheme, customTheme]
      );
    }
  );

  it.each([
    [mockTheme.noBase, JSON.parse(mockPreload.dataA) as ThemePreloadData],
    [mockTheme.noBase, null],
    [mockTheme.withBase, JSON.parse(mockPreload.dataB) as ThemePreloadData],
    [mockTheme.withBase, null],
  ] as const)(
    'should derive base theme from custom theme or fallback: %s, %s',
    (customTheme, preloadData) => {
      asMock(localStorage.getItem).mockReturnValue(
        preloadData == null ? null : JSON.stringify(preloadData)
      );
      asMock(themeCache.getBaseTheme).mockReturnValue(mockTheme.noBase);
      asMock(themeCache.getCustomTheme).mockReturnValue(customTheme);

      themeCache.getAppliedThemes();
      expect(themeCache.getBaseTheme).toHaveBeenCalledWith(
        customTheme.baseThemeKey ??
          preloadData?.themeKey ??
          DEFAULT_DARK_THEME_KEY
      );
    }
  );
});

describe('registerBaseThemes', () => {
  it('should register the base themes', () => {
    const given = [mockTheme.noBase, mockTheme.withBase];

    given.forEach(theme => {
      expect(themeCache.getBaseTheme(theme.themeKey)).toBeNull();
    });
    expect(themeCache.onChange).not.toHaveBeenCalled();

    themeCache.registerBaseThemes(given);

    given.forEach(theme => {
      expect(themeCache.getBaseTheme(theme.themeKey)).toBe(theme);
    });
    expect(themeCache.onChange).toHaveBeenCalledTimes(1);
  });
});

describe('registerCustomThemes', () => {
  it('should register the custom theme', () => {
    const given = [mockTheme.noBase, mockTheme.withBase];

    given.forEach(theme => {
      expect(themeCache.getCustomTheme(theme.themeKey)).toBeNull();
    });
    expect(themeCache.onChange).not.toHaveBeenCalled();

    themeCache.registerCustomThemes(given);

    given.forEach(theme => {
      expect(themeCache.getCustomTheme(theme.themeKey)).toBe(theme);
    });
    expect(themeCache.onChange).toHaveBeenCalledTimes(1);
  });
});

describe('registerEventListener', () => {
  it('should register event listeners', () => {
    const mockListenerA = jest.fn();
    const mockListenerB = jest.fn();

    const deregisterA = themeCache.registerEventListener(
      'change',
      mockListenerA
    );
    const deregisterB = themeCache.registerEventListener(
      'change',
      mockListenerB
    );

    themeCache.onChange();

    expect(mockListenerA).toHaveBeenCalledTimes(1);
    expect(mockListenerB).toHaveBeenCalledTimes(1);

    deregisterA();
    deregisterB();
    jest.clearAllMocks();

    themeCache.onChange();

    expect(mockListenerA).not.toHaveBeenCalled();
    expect(mockListenerB).not.toHaveBeenCalled();
  });
});
