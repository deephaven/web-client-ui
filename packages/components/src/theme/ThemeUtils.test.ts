import { TestUtils } from '@deephaven/utils';
import {
  replaceCssVariables,
  selectTheme,
  ThemeVariables,
  THEME_LOCAL_STORAGE_KEY,
} from './ThemeUtils';

const { createMockProxy } = TestUtils;

// const cssCustomProperties = {
//   // Colors
//   '--dh-color-gray-900': '#fcfcfa',
//   '--dh-color-gray-800': '#f0f0ee',
//   '--dh-color-gray-700': '#c0bfbf',
//   '--dh-color-gray-600': '#929192',
//   '--dh-color-gray-500': '#5b5a5c',
//   '--dh-color-gray-400': '#403e41',
//   '--dh-color-gray-300': '#373438',
//   '--dh-color-gray-200': '#322f33',
//   '--dh-color-gray-100': '#2d2a2e',
//   '--dh-color-gray-75': '#211f22',
//   '--dh-color-gray-50': '#1a171a',
//   '--dh-color-black': 'var(--dh-color-gray-50)',
//   '--dh-color-white': 'var(--dh-color-gray-800)',
//   // Semantic
//   '--dh-semantic-background-color': 'var(--dh-color-black)',
//   '--dh-semantic-foreground-color': 'var(--dh-color-white)',
// };

const mockGetPropertyValue = jest.fn();

beforeEach(() => {
  document.body.className = '';
  jest.clearAllMocks();
  expect.hasAssertions();

  jest.spyOn(window, 'getComputedStyle').mockImplementation(() =>
    createMockProxy<CSSStyleDeclaration>({
      getPropertyValue: mockGetPropertyValue,
    })
  );
});

describe('replaceCssVariables', () => {
  beforeEach(() => {
    mockGetPropertyValue.mockImplementation(name => `replaced${name}`);
  });

  it.each([null, document.body, document.createElement('div')])(
    'should replace css variables: %s',
    targetEl => {
      const given: ThemeVariables = {
        aaa: 'var(--dh-color-gray-900)',
        bbb: 'var(--dh-color-black)',
        ccc: '4px var(--dh-color-black)',
        ddd: 'var(--dh-color-gray-900) var(--dh-color-black) 9px solid',
      };

      const expected: ThemeVariables = {
        aaa: 'replaced--dh-color-gray-900',
        bbb: 'replaced--dh-color-black',
        ccc: '4px replaced--dh-color-black',
        ddd: 'replaced--dh-color-gray-900 replaced--dh-color-black 9px solid',
      };

      const actual = replaceCssVariables(targetEl, given);

      expect(getComputedStyle).toHaveBeenCalledWith(targetEl ?? document.body);
      expect(actual).toEqual(expected);
    }
  );
});

describe('selectTheme', () => {
  it.each(['', 'default-dark', 'custom-aaa'])(
    'should set the theme key in local storage: %s',
    themeKey => {
      selectTheme(themeKey);

      if (themeKey === '') {
        expect(localStorage.getItem(THEME_LOCAL_STORAGE_KEY)).toBeNull();
      } else {
        expect(localStorage.getItem(THEME_LOCAL_STORAGE_KEY)).toEqual(themeKey);
      }
    }
  );

  it('should throw an error for invalid theme keys', () => {
    const themeKey = 'not-key';

    expect(() => selectTheme(themeKey)).toThrow(
      `Invalid theme key: ${themeKey}`
    );
  });

  it.each([
    ['', 'dh-theme-default-dark'],
    ['default-dark', 'dh-theme-default-dark'],
    ['default-light', 'dh-theme-default-light'],
  ])(
    'should set default theme css classes on body: %s, %s',
    (themeKey, expectedClassName) => {
      selectTheme(themeKey);

      expect(mockGetPropertyValue).not.toHaveBeenCalled();
      expect(document.body.className).toEqual(expectedClassName);
    }
  );

  it.each([
    ['custom-aaa', '', 'dh-theme-custom-aaa dh-theme-default-dark'],
    ['custom-aaa', 'base-theme', 'dh-theme-custom-aaa dh-theme-base-theme'],
  ])(
    'should set default + custom theme classes on body: %s, %s, %s',
    (themeKey, baseThemeKey, expectedClassName) => {
      mockGetPropertyValue.mockImplementation(name =>
        name === '--dh-base-theme' ? baseThemeKey : 'unexpected'
      );

      selectTheme(themeKey);

      expect(document.body.className).toEqual(expectedClassName);
    }
  );
});
