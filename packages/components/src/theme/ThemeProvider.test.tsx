import React from 'react';
import { act, render } from '@testing-library/react';
import { assertNotNull } from '@deephaven/utils';
import { TestUtils } from '@deephaven/test-utils';
import { type ThemeContextValue, ThemeProvider } from './ThemeProvider';
import { DEFAULT_LIGHT_THEME_KEY, type ThemeData } from './ThemeModel';
import {
  calculatePreloadStyleContent,
  getActiveThemes,
  getDefaultBaseThemes,
  getDefaultSelectedThemeKey,
  setThemePreloadData,
} from './ThemeUtils';
import { useTheme } from './useTheme';

const { asMock } = TestUtils;

jest.mock('./ThemeUtils', () => {
  const actual = jest.requireActual('./ThemeUtils');
  return {
    ...actual,
    calculatePreloadStyleContent: jest.fn(),
    getDefaultSelectedThemeKey: jest.fn(),
    getThemeKeyOverride: jest.fn(),
    setThemePreloadData: jest.fn(),
  };
});

const customThemes = [
  { themeKey: 'themeA' },
  { themeKey: 'mockDefaultSelectedThemeKey' },
] as ThemeData[];
const defaultSelectedThemeKey = 'mockDefaultSelectedThemeKey';

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  expect.hasAssertions();

  asMock(calculatePreloadStyleContent)
    .mockName('calculatePreloadStyleContent')
    .mockReturnValue(':root{mock-preload-content}');

  asMock(getDefaultSelectedThemeKey)
    .mockName('getDefaultSelectedThemeKey')
    .mockReturnValue(defaultSelectedThemeKey);

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

  it.each([null, customThemes])(
    'should load themes based on default selected theme key. customThemes: %o',
    themes => {
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
          getActiveThemes(defaultSelectedThemeKey, {
            base: getDefaultBaseThemes(),
            custom: themes,
          })
        );

        expect(themeContextValueRef.current.selectedThemeKey).toEqual(
          defaultSelectedThemeKey
        );
      }

      expect(component.baseElement).toMatchSnapshot();
    }
  );

  it.each([null, customThemes] as const)(
    'should set preload data when active themes change: %o',
    themes => {
      render(
        <ThemeProvider themes={themes}>
          <MockChild />
        </ThemeProvider>
      );

      if (themes == null) {
        expect(setThemePreloadData).not.toHaveBeenCalled();
      } else {
        expect(setThemePreloadData).toHaveBeenCalledWith({
          themeKey: defaultSelectedThemeKey,
          preloadStyleContent: calculatePreloadStyleContent({}),
        });
      }
    }
  );

  describe.each([null, customThemes])('setSelectedThemeKey: %o', themes => {
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
