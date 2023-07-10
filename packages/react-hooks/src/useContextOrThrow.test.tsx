import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import useContextOrThrow from './useContextOrThrow';

const TestContext = React.createContext<string | null>(null);

describe('throw if not wrapped in a provider', () => {
  it('should throw default error', () => {
    const { result } = renderHook(() => useContextOrThrow(TestContext));
    expect(result.error).not.toBeNull();
  });

  it('should throw custom error message', () => {
    const errorMessage = 'Test Error Message';
    const { result } = renderHook(() =>
      useContextOrThrow(TestContext, errorMessage)
    );
    expect(result.error).toEqual(new Error(errorMessage));
  });
});

it('should not throw if wrapped in a provider', () => {
  const value = 'Test Value';
  const wrapper = ({ children }) => (
    <TestContext.Provider value={value}>{children}</TestContext.Provider>
  );
  const { result } = renderHook(() => useContextOrThrow(TestContext), {
    wrapper,
  });
  expect(result.current).toBe(value);
});
