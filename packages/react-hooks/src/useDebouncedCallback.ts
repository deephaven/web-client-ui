import { useEffect, useMemo } from 'react';
import type { DebouncedFunc, DebounceSettings } from 'lodash';
import debounce from 'lodash.debounce';

/**
 * Wraps a given callback in a cancelable, debounced function. The debounced
 * callback is automatically cancelled if the callback reference changes or the
 * component unmounts.
 * @param callback callback function to debounce
 * @param debounceMs debounce milliseconds
 * @param options debounce options such as leading or trailing behavior
 * @returns a cancelable, debounced function
 */
export function useDebouncedCallback<TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
  debounceMs: number,
  options: DebounceSettings = {}
): DebouncedFunc<(...args: TArgs) => TResult> {
  const { leading = false, trailing = true, maxWait } = options;
  const debouncedCallback = useMemo(
    () =>
      debounce(callback, debounceMs, {
        leading,
        trailing,
        maxWait,
      }),
    [callback, debounceMs, leading, trailing, maxWait]
  );

  console.log(leading, trailing);

  useEffect(() => {
    console.log('cancel');
    return () => debouncedCallback.cancel();
  }, [debouncedCallback]);

  return debouncedCallback;
}

export default useDebouncedCallback;
