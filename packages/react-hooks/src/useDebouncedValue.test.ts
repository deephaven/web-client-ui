import { act, renderHook } from '@testing-library/react-hooks';
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
  expect(result.current).toBe(value);
});

it('should return the initial value after the debounce time has elapsed', () => {
  const value = 'mock value';
  const { result, rerender } = renderHook(() =>
    useDebouncedValue(value, DEFAULT_DEBOUNCE_MS)
  );
  expect(result.current).toBe(value);
  expect(result.all.length).toBe(1);
  rerender();
  act(() => {
    jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
  });
  expect(result.current).toBe(value);
  expect(result.all.length).toBe(2);
});

it('should return the updated value after the debounce time has elapsed', () => {
  const value = 'mock value';
  const newValue = 'mock new value';
  const { result, rerender } = renderHook((val = value) =>
    useDebouncedValue(val, DEFAULT_DEBOUNCE_MS)
  );
  expect(result.current).toBe(value);
  rerender(newValue);
  act(() => {
    jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
  });
  expect(result.current).toBe(newValue);
});

it('should not return an intermediate value if the debounce time has not elapsed', () => {
  const value = 'mock value';
  const intermediateValue = 'mock intermediate value';
  const newValue = 'mock new value';
  const { result, rerender } = renderHook((val = value) =>
    useDebouncedValue(val, DEFAULT_DEBOUNCE_MS)
  );
  expect(result.current).toBe(value);
  rerender(intermediateValue);
  act(() => {
    jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS - 5);
  });
  expect(result.current).toBe(value);
  rerender(newValue);
  act(() => {
    jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS - 5);
  });
  expect(result.current).toBe(value);
  act(() => {
    jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
  });
  expect(result.current).toBe(newValue);
});
