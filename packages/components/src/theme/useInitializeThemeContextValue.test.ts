import { act, renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/utils';
import { useInitializeThemeContextValue } from './useInitializeThemeContextValue';
import {
  DEFAULT_DARK_THEME_KEY,
  ThemeData,
  ThemeRegistrationData,
} from './ThemeModel';
import {
  calculatePreloadStyleContent,
  getActiveThemes,
  setThemePreloadData,
} from './ThemeUtils';

const { asMock } = TestUtils;

jest.mock('./ThemeUtils', () => ({
  ...jest.requireActual('./ThemeUtils'),
  calculatePreloadStyleContent: jest.fn(),
  getActiveThemes: jest.fn(),
  setThemePreloadData: jest.fn(),
}));

const themesA = [{ themeKey: 'themeA' }] as [ThemeData];
const themesB = [{ themeKey: 'themeB' }] as [ThemeData];
const themesDefault = [{ themeKey: 'themeDefault' }] as [ThemeData];

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  expect.hasAssertions();

  asMock(calculatePreloadStyleContent)
    .mockName('calculatePreloadStyleContent')
    .mockReturnValue(':root{mock-preload-content}');

  asMock(getActiveThemes).mockName('getActiveThemes');
  asMock(setThemePreloadData).mockName('setThemePreloadData');
});

describe('useInitializeThemeContextValue', () => {
  it('should return null activeThemes and should not update preload data until themes are registered', () => {
    asMock(getActiveThemes).mockReturnValue(themesA);

    const { result } = renderHook(() => useInitializeThemeContextValue());
    expect(result.current.activeThemes).toBeNull();
    expect(setThemePreloadData).not.toHaveBeenCalled();
  });

  it.each([[themesDefault], [themesA]])(
    'should update active themes and preload data based on selected theme + registered themes: %s',
    activeThemes => {
      asMock(getActiveThemes).mockReturnValue(activeThemes);

      const { result } = renderHook(() => useInitializeThemeContextValue());

      const themeRegistration: ThemeRegistrationData = {
        base: themesA,
        custom: themesB,
      };

      act(() => result.current.registerThemes(themeRegistration));

      function commonAssertions(expectedThemeKey: string) {
        expect(result.current.selectedThemeKey).toEqual(expectedThemeKey);

        expect(getActiveThemes).toHaveBeenCalledWith(
          expectedThemeKey,
          themeRegistration
        );

        expect(setThemePreloadData).toHaveBeenCalledWith({
          themeKey: expectedThemeKey,
          preloadStyleContent: calculatePreloadStyleContent(),
        });

        expect(result.current.activeThemes).toEqual(activeThemes);
      }

      commonAssertions(DEFAULT_DARK_THEME_KEY);

      jest.clearAllMocks();
      act(() => result.current.setSelectedThemeKey('themeB'));
      commonAssertions('themeB');
    }
  );
});
