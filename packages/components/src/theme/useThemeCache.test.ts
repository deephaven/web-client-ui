import { useContext } from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { TestUtils } from '@deephaven/utils';
import { useThemeCache } from './useThemeCache';

const { asMock } = TestUtils;

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

const themeContextValue = {};

beforeEach(() => {
  jest.clearAllMocks();
  expect.hasAssertions();

  asMock(useContext).mockName('useContext');
});

describe('useThemeCache', () => {
  it('should return theme context value', () => {
    asMock(useContext).mockReturnValue(themeContextValue);

    const { result } = renderHook(() => useThemeCache());
    expect(result.current).toBe(themeContextValue);
  });

  it('should throw if context is null', () => {
    asMock(useContext).mockReturnValue(null);

    const { result } = renderHook(() => useThemeCache());
    expect(result.error).toEqual(
      new Error(
        'No ThemeCacheContext value found. Component must be wrapped in a ThemeCacheContext.Provider'
      )
    );
  });
});
