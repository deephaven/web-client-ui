import { useEffect, useMemo, useRef } from 'react';
import type { DebouncedFunc, ThrottleSettings } from 'lodash';
import throttle from 'lodash.throttle';

/**
 * Wraps a given callback in a cancelable, throttled function. The throttled
 * callback is automatically cancelled if the callback reference changes or the
 * component unmounts.
 * @param callback callback function to throttle
 * @param throttleMs throttle milliseconds
 * @param options lodash throttle options. Will not react to changes to this param
 * @returns a cancelable, throttled function
 */
export function useThrottledCallback<TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
  throttleMs: number,
  initialOptions?: ThrottleSettings & { flushOnUnmount?: boolean }
): DebouncedFunc<(...args: TArgs) => TResult> {
  const options = useRef(initialOptions);

  // Use a ref for the callback
  // We want to keep a stable callback so the flush/cancel works as expected
  // So we keep a ref to the current callback, then we have a throttled callback that will just call this
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const throttledCallback = useMemo(
    () =>
      throttle(
        (...args: TArgs) => callbackRef.current(...args),
        throttleMs,
        options.current
      ),
    [throttleMs]
  );

  useEffect(
    () => () => {
      if (options.current?.flushOnUnmount ?? false) {
        throttledCallback.flush();
      } else {
        throttledCallback.cancel();
      }
    },
    [throttledCallback]
  );

  return throttledCallback;
}

export default useThrottledCallback;
