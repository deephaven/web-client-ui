import { act, renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/utils';
import ThemeCache from './ThemeCache';
import { useInitializeThemeContextValue } from './useInitializeThemeContextValue';
import { useAppliedThemes } from './useAppliedThemes';
import { useThemeCache } from './useThemeCache';
import { ThemeData } from './ThemeModel';
import { calculatePreloadStyleContent } from './ThemeUtils';

const { asMock } = TestUtils;

jest.mock('./useAppliedThemes');
jest.mock('./useThemeCache');
jest.mock('./ThemeUtils', () => ({
  ...jest.requireActual('./ThemeUtils'),
  calculatePreloadStyleContent: jest.fn(),
}));

const themesA = [{ themeKey: 'themeA' }] as [ThemeData];
const themesB = [{ themeKey: 'themeB' }] as [ThemeData];
const themeCache = new ThemeCache('mock-theme-cache');

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  expect.hasAssertions();

  asMock(calculatePreloadStyleContent)
    .mockName('calculatePreloadStyleContent')
    .mockReturnValue(':root{mock-preload-content}');

  asMock(useAppliedThemes)
    .mockName('useAppliedThemes')
    .mockReturnValue(themesA);

  asMock(useThemeCache).mockName('useThemeCache').mockReturnValue(themeCache);

  jest
    .spyOn(themeCache, 'registerCustomThemes')
    .mockName('registerCustomThemes');

  jest.spyOn(themeCache, 'setPreloadData').mockName('setPreloadData');
});

describe('useInitializeThemeContextValue', () => {
  it('should return theme cache', () => {
    const { result } = renderHook(() => useInitializeThemeContextValue());
    expect(result.current.cache).toBe(themeCache);
  });

  it('should return null activeThemes until activated', () => {
    const { result } = renderHook(() => useInitializeThemeContextValue());
    expect(result.current.activeThemes).toBeNull();
  });

  it.each([null, themesA])(
    'should return register custom themes, set preload data, and activate',
    appliedThemes => {
      asMock(useAppliedThemes).mockReturnValue(appliedThemes);

      const { result } = renderHook(() => useInitializeThemeContextValue());

      expect(result.current.activeThemes).toBeNull();
      expect(themeCache.setPreloadData).not.toHaveBeenCalled();

      act(() => {
        result.current.registerCustomThemesAndActivate(themesB);
      });

      expect(themeCache.registerCustomThemes).toHaveBeenCalledWith(themesB);

      if (appliedThemes == null) {
        expect(themeCache.setPreloadData).not.toHaveBeenCalled();
      } else {
        expect(themeCache.setPreloadData).toHaveBeenCalledWith({
          themeKey: appliedThemes[0].themeKey,
          preloadStyleContent: calculatePreloadStyleContent(),
        });
      }
      expect(result.current.activeThemes).toEqual(appliedThemes);
    }
  );
});
