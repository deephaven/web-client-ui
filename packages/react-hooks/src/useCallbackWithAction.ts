import { useCallback } from 'react';

/**
 * Wrap a callback function + an additional "action" function in
 * a new function. The new function takes the parameters belonging to
 * the callback and passes them through. The action function will
 * not receive any parameters.
 * @param callback Function
 * @param action Parameterless function to call after the callback
 */
export function useCallbackWithAction<TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
  action: () => void
): (...args: TArgs) => TResult {
  return useCallback(
    (...args: TArgs) => {
      const result = callback(...args);
      action();
      return result;
    },
    [action, callback]
  );
}

export default useCallbackWithAction;
