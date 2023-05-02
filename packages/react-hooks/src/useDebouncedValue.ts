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
  console.log('render', value);
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    console.log('MJB setting timeout', value);
    const timeoutId = setTimeout(() => {
      console.log('MJB setting debounced value');
      setDebouncedValue(value);
    }, debounceMs);
    return () => {
      console.log('MJB clearing timeout');
      clearTimeout(timeoutId);
    };
  }, [value, debounceMs]);

  return debouncedValue;
}

export default useDebouncedValue;
