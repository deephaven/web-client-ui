import { useEffect, useMemo, useRef } from 'react';
import type { DebouncedFunc, ThrottleSettings } from 'lodash';
import throttle from 'lodash.throttle';

/**
 * Wraps a given callback in a cancelable, throttled function. The throttled
 * callback is stable and will never change. It will be automatically cancelled
 * on unmount, unless the `flushOnUnmount` option is passed in, then it will be flushed on unmount.
 * At the time the throttled function is called, it will call the latest callback that has been passed in.
 * @param callback callback function to call with throttling
 * @param throttleMs throttle milliseconds
 * @param initialOptions lodash throttle options. Will not react to changes to this param
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
