import { MutableRefObject, useCallback } from 'react';

/**
 * Returns a callback ref that will map it's argument
 * and set the given targetRef with the result.
 * @param targetRef Ref to assign mapped result to
 * @param map Function to map given ref value to another value
 */
export function useMappedRef<T, U>(
  targetRef: MutableRefObject<U> | ((ref: U) => void),
  map: (ref: T) => U
): (ref: T) => void {
  return useCallback(
    (ref: T) => {
      if (typeof targetRef === 'function') {
        targetRef(map(ref));
      } else {
        // eslint-disable-next-line no-param-reassign
        targetRef.current = map(ref);
      }
    },
    [map, targetRef]
  );
}

export default useMappedRef;
