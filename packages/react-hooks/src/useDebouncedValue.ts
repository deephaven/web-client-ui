import { useEffect, useState } from 'react';

/**
 * Debounces a value.
 * Returns the initial value immediately.
 * Returns the latest value after no changes have occurred for the debounce duration.
 * @param value Value to debounce
 * @param debounceMs Amount of time to debounce
 * @returns The debounced value + whether the value is still debouncing
 */
export function useDebouncedValue<T>(
  value: T,
  debounceMs: number
): { isDebouncing: boolean; value: T } {
  const [isDebouncing, setIsDebouncing] = useState(true);
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Keep `isDebouncing` in sync with `value` and `debounceMs` by setting state
  // during render instead of in `useEffect`
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [previousValue, setPreviousValue] = useState(value);
  const [previousDebounceMs, setPreviousDebounceMs] = useState(debounceMs);
  if (value !== previousValue || debounceMs !== previousDebounceMs) {
    setIsDebouncing(true);
    setPreviousValue(value);
    setPreviousDebounceMs(debounceMs);
  }

  useEffect(() => {
    let isCancelled = false;

    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        setIsDebouncing(false);
        setDebouncedValue(value);
      }
    }, debounceMs);
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [value, debounceMs]);

  return { isDebouncing, value: debouncedValue };
}

export default useDebouncedValue;
