import { act, renderHook } from '@testing-library/react';
import useDebouncedValue from './useDebouncedValue';

const DEFAULT_DEBOUNCE_MS = 100;
beforeEach(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

it('should return the initial value', () => {
  const value = 'mock value';
  const { result } = renderHook(() =>
    useDebouncedValue(value, DEFAULT_DEBOUNCE_MS)
  );
  expect(result.current).toEqual({ isDebouncing: true, value });
});

it('should return the initial value after the debounce time has elapsed', () => {
  const value = 'mock value';
  let renderCount = 0;
  const { result, rerender } = renderHook(() => {
    renderCount += 1;
    return useDebouncedValue(value, DEFAULT_DEBOUNCE_MS);
  });
  expect(result.current).toEqual({ isDebouncing: true, value });
  expect(renderCount).toBe(1);

  rerender();
  expect(result.current).toEqual({ isDebouncing: true, value });
  expect(renderCount).toBe(2);

  act(() => {
    jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
  });
  expect(result.current).toEqual({ isDebouncing: false, value });
  expect(renderCount).toBe(3);
});

it('should return the updated value after the debounce time has elapsed', () => {
  const value = 'mock value';
  const newValue = 'mock new value';
  const { result, rerender } = renderHook((val = value) =>
    useDebouncedValue(val, DEFAULT_DEBOUNCE_MS)
  );
  expect(result.current).toEqual({ isDebouncing: true, value });

  rerender(newValue);
  expect(result.current).toEqual({ isDebouncing: true, value });

  act(() => {
    jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
  });
  expect(result.current).toEqual({ isDebouncing: false, value: newValue });
});

it('should not return an intermediate value if the debounce time has not elapsed', () => {
  const value = 'mock value';
  const intermediateValue = 'mock intermediate value';
  const newValue = 'mock new value';
  const { result, rerender } = renderHook((val = value) =>
    useDebouncedValue(val, DEFAULT_DEBOUNCE_MS)
  );
  expect(result.current).toEqual({ isDebouncing: true, value });
  rerender(intermediateValue);
  act(() => {
    jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS - 5);
  });
  expect(result.current).toEqual({ isDebouncing: true, value });
  rerender(newValue);
  act(() => {
    jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS - 5);
  });
  expect(result.current).toEqual({ isDebouncing: true, value });
  act(() => {
    jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
  });
  expect(result.current).toEqual({ isDebouncing: false, value: newValue });
});
