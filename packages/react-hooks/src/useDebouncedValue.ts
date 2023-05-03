import { useEffect, useState } from 'react';

export const DEFAULT_DEBOUNCE_MS = 250;

/**
 * Debounces a value. Returns the value after the debounce time has elapsed.
 * @param value Value to debounce
 * @param debounceMs Amount of time to debounce
 * @returns The debounced value
 */
export function useDebouncedValue<T>(
  value: T,
  debounceMs = DEFAULT_DEBOUNCE_MS
) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, debounceMs]);

  return debouncedValue;
}

export default useDebouncedValue;
