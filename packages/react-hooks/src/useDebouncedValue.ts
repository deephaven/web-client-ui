import { useEffect, useMemo, useState } from 'react';

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
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // Set isDebouncing to true immediately whenever the value changes. Using
  // `useMemo` instead of `useEffect` so that state is never out of sync whenever
  // value and / or debounceMs have changed.
  useMemo(() => {
    setIsDebouncing(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, debounceMs]);

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
