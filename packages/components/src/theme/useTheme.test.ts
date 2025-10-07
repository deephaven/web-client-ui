import { useContext } from 'react';
import { renderHook } from '@testing-library/react';
import { TestUtils } from '@deephaven/test-utils';
import { useTheme } from './useTheme';

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

describe('useTheme', () => {
  it('should return theme context value', () => {
    asMock(useContext).mockReturnValue(themeContextValue);

    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe(themeContextValue);
  });

  it('should throw if context is null', () => {
    TestUtils.disableConsoleOutput();
    asMock(useContext).mockReturnValue(null);

    expect(() => renderHook(() => useTheme())).toThrow(
      new Error(
        'No ThemeContext value found. Component must be wrapped in a ThemeContext.Provider'
      )
    );
  });
});
