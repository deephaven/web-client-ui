import { useEffect, useMemo } from 'react';
import type { DebouncedFunc } from 'lodash';
import debounce from 'lodash.debounce';

/**
 * Wraps a given callback in a cancelable, debounced function. The debounced
 * callback is automatically cancelled if the callback reference changes or the
 * component unmounts.
 * @param callback callback function to debounce
 * @param debounceMs debounce milliseconds
 * @returns a cancelable, debounced function
 */
export function useDebouncedCallback<TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
  debounceMs: number
): DebouncedFunc<(...args: TArgs) => TResult> {
  const debouncedCallback = useMemo(
    () => debounce(callback, debounceMs),
    [callback, debounceMs]
  );

  useEffect(() => () => debouncedCallback.cancel(), [debouncedCallback]);

  return debouncedCallback;
}

export default useDebouncedCallback;
