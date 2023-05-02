import { act, renderHook } from '@testing-library/react-hooks';
import useDebouncedValue, { DEFAULT_DEBOUNCE_MS } from './useDebouncedValue';

beforeEach(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

// it('should return the initial value', () => {
//   const value = 'mock value';
//   const { result } = renderHook(() => useDebouncedValue(value));
//   expect(result.current).toBe(value);
// });

// it('should return the initial value after the debounce time has elapsed', () => {
//   const value = 'mock value';
//   const { result, rerender } = renderHook(() => useDebouncedValue(value));
//   expect(result.current).toBe(value);
//   rerender();
//   jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS + 5);
//   expect(result.current).toBe(value);
// });

it('should return the updated value after the debounce time has elapsed', async () => {
  const value = 'mock value';
  const newValue = 'mock new value';
  const {
    result,
    rerender,
    waitForNextUpdate,
  } = renderHook(({ val = value } = {}) => useDebouncedValue(val));
  expect(result.current).toBe(value);
  console.log('MJB rerendering new value');
  rerender(newValue);
  jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS + 5);
  console.log('MJB after timers');
  await waitForNextUpdate();
  expect(result.current).toBe(newValue);
});

// it('should not return an intermediate value if the debounce time has not elapsed', () => {
//   const value = 'mock value';
//   const intermediateValue = 'mock intermediate value';
//   const newValue = 'mock new value';
//   const { result, rerender } = renderHook(() => useDebouncedValue(value));
//   expect(result.current).toBe(value);
//   rerender(newValue);
//   jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS + 5);
//   expect(result.current).toBe(newValue);
// });
