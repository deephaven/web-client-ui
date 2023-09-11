import { useRef } from 'react';

/**
 * Memoize a value based on an isEqual predicate instead of reference equality.
 * @param value Value to memoize
 * @param isEqual Predicate to see if value has changed since last render
 */
export function useIsEqualMemo<T>(
  value: T,
  isEqual: (valueA: T, valueB: T) => boolean
): T {
  const previousValueRef = useRef<T>(value);

  const currentValue = isEqual(previousValueRef.current, value)
    ? previousValueRef.current
    : value;

  previousValueRef.current = currentValue;

  return currentValue;
}

export default useIsEqualMemo;
