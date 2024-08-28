import React from 'react';
import { act, render } from '@testing-library/react';
import { assertNotNull, TestUtils } from '@deephaven/utils';
import { ThemeContextValue, ThemeProvider } from './ThemeProvider';
import {
  DEFAULT_DARK_THEME_KEY,
  DEFAULT_LIGHT_THEME_KEY,
  ThemeData,
  ThemePreloadData,
} from './ThemeModel';
import {
  calculatePreloadStyleContent,
  getActiveThemes,
  getDefaultBaseThemes,
  getThemeKeyOverride,
  getThemePreloadData,
  setThemePreloadData,
} from './ThemeUtils';
import { useTheme } from './useTheme';

const { asMock } = TestUtils;

jest.mock('./ThemeUtils', () => {
  const actual = jest.requireActual('./ThemeUtils');
  return {
    ...actual,
    calculatePreloadStyleContent: jest.fn(),
    getThemeKeyOverride: jest.fn(),
    getThemePreloadData: jest.fn(actual.getThemePreloadData),
    setThemePreloadData: jest.fn(),
  };
});

const customThemes = [{ themeKey: 'themeA' }] as [ThemeData];
const preloadA: ThemePreloadData = { themeKey: 'themeA' };

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  expect.hasAssertions();

  asMock(calculatePreloadStyleContent)
    .mockName('calculatePreloadStyleContent')
    .mockReturnValue(':root{mock-preload-content}');

  asMock(getThemeKeyOverride)
    .mockName('getThemeKeyOverride')
    .mockReturnValue(null);

  asMock(getThemePreloadData).mockName('getThemePreloadData');
  asMock(setThemePreloadData).mockName('setThemePreloadData');
});

describe('ThemeProvider', () => {
  const themeContextValueRef = { current: null as ThemeContextValue | null };

  function MockChild() {
    themeContextValueRef.current = useTheme();
    return <div>Child</div>;
  }

  beforeEach(() => {
    themeContextValueRef.current = null;
  });

  it.each([
    [null, null, null],
    [null, preloadA, null],
    [customThemes, null, null],
    [customThemes, preloadA, null],
    [null, null, 'themeOverrideKey'],
    [null, preloadA, 'themeOverrideKey'],
    [customThemes, null, 'themeOverrideKey'],
    [customThemes, preloadA, 'themeOverrideKey'],
  ] as const)(
    'should load themes based on override, preload data or default: %s, %s, %s',
    (themes, preloadData, overrideKey) => {
      asMock(getThemeKeyOverride).mockReturnValue(overrideKey);
      asMock(getThemePreloadData).mockReturnValue(preloadData);

      const component = render(
        <ThemeProvider themes={themes}>
          <MockChild />
        </ThemeProvider>
      );

      assertNotNull(themeContextValueRef.current);

      if (themes == null) {
        expect(themeContextValueRef.current.activeThemes).toBeNull();
      } else {
        expect(themeContextValueRef.current.activeThemes).toEqual(
          getActiveThemes(
            overrideKey ?? preloadData?.themeKey ?? DEFAULT_DARK_THEME_KEY,
            {
              base: getDefaultBaseThemes(),
              custom: themes,
            }
          )
        );

        expect(themeContextValueRef.current.selectedThemeKey).toEqual(
          overrideKey ?? preloadData?.themeKey ?? DEFAULT_DARK_THEME_KEY
        );
      }

      expect(component.baseElement).toMatchSnapshot();
    }
  );

  it.each([
    [null, null],
    [null, preloadA],
    [customThemes, null],
    [customThemes, preloadA],
  ] as const)(
    'should set preload data when active themes change: %s, %s',
    (themes, preloadData) => {
      asMock(getThemePreloadData).mockReturnValue(preloadData);

      render(
        <ThemeProvider themes={themes}>
          <MockChild />
        </ThemeProvider>
      );

      if (themes == null) {
        expect(setThemePreloadData).not.toHaveBeenCalled();
      } else {
        expect(setThemePreloadData).toHaveBeenCalledWith({
          themeKey: preloadData?.themeKey ?? DEFAULT_DARK_THEME_KEY,
          preloadStyleContent: calculatePreloadStyleContent({}),
        });
      }
    }
  );

  describe.each([null, customThemes])('setSelectedThemeKey: %s', themes => {
    it.each([DEFAULT_LIGHT_THEME_KEY, customThemes[0].themeKey])(
      'should change selected theme: %s',
      themeKey => {
        const component = render(
          <ThemeProvider themes={themes}>
            <MockChild />
          </ThemeProvider>
        );

        assertNotNull(themeContextValueRef.current);

        if (themes == null) {
          expect(themeContextValueRef.current.activeThemes).toBeNull();
        } else {
          act(() => {
            themeContextValueRef.current!.setSelectedThemeKey(themeKey);
          });

          expect(themeContextValueRef.current.activeThemes).toEqual(
            getActiveThemes(themeKey, {
              base: getDefaultBaseThemes(),
              custom: themes,
            })
          );

          expect(themeContextValueRef.current.selectedThemeKey).toEqual(
            themeKey
          );
        }

        expect(component.baseElement).toMatchSnapshot();
      }
    );
  });
});
