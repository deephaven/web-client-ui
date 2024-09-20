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
      debounce(
        callback,
        debounceMs,
        maxWait != null
          ? // lodash checks `'maxWait' in options`
            // and lower clamps to the debounce if it exists at all
            {
              leading,
              trailing,
              maxWait,
            }
          : {
              leading,
              trailing,
            }
      ),
    [callback, debounceMs, leading, trailing, maxWait]
  );

  useEffect(() => () => debouncedCallback.cancel(), [debouncedCallback]);

  return debouncedCallback;
}

export default useDebouncedCallback;
