import { act, renderHook } from '@testing-library/react-hooks';
import ThemeCache from './ThemeCache';
import { useAppliedThemes } from './useAppliedThemes';
import { ThemeData } from './ThemeModel';

const themeCache = new ThemeCache('mock-theme-cache');

const mock = {
  getAppliedThemesResultA: [{ themeKey: 'themeA' }] as [ThemeData],
  getAppliedThemesResultB: [{ themeKey: 'themeB' }] as [ThemeData],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  expect.hasAssertions();

  const getAppliedThemesResults = [
    mock.getAppliedThemesResultA,
    mock.getAppliedThemesResultB,
  ];

  jest
    .spyOn(themeCache, 'getAppliedThemes')
    .mockName('getAppliedThemes')
    .mockImplementation(() => getAppliedThemesResults.shift() ?? null);
});

describe('useAppliedThemes', () => {
  it('should return the currently applied themes from the cache', () => {
    const { result } = renderHook(() => useAppliedThemes(themeCache));

    expect(result.current).toEqual(mock.getAppliedThemesResultA);

    act(() => {
      themeCache.onChange();
    });

    expect(result.current).toEqual(mock.getAppliedThemesResultB);
  });

  it('should deregister the event listener when the hook is unmounted', () => {
    const { result, unmount } = renderHook(() => useAppliedThemes(themeCache));

    expect(result.current).toEqual(mock.getAppliedThemesResultA);

    unmount();

    act(() => {
      themeCache.onChange();
    });

    expect(result.current).toEqual(mock.getAppliedThemesResultA);
  });
});
