import { DependencyList, EffectCallback, useEffect, useRef } from 'react';

/**
 * Custom useEffect hook that runs an effect function up to `n` times as long
 * as a given `condition` value is true.
 *
 * The effect will be evaluated whenever the dependency array, the value of `n`,
 * or the `condition` value changes. If the counter is < n and the condition is
 * true, the effectCallback will be run, and the counter will be incremented.
 * Note that the counter will never get reset even if parameters change.
 * @param effectCallback Effect function to run
 * @param effectCallbackDependencies Dependencies for the effect function
 * @param n Number of times to run when condition is met
 * @param condition Condition that must be true to run
 */
export function useEffectNTimesWhen(
  effectCallback: EffectCallback,
  effectCallbackDependencies: DependencyList,
  n: number,
  condition: boolean
): void {
  const countRef = useRef(0);

  useEffect(() => {
    if (countRef.current >= n) {
      return;
    }

    if (condition) {
      countRef.current += 1;
      effectCallback();
    }
    // The `effectCallback` is intentionally excluded from the dependencies list
    // below since its reference may change on every render. Instead, the
    // `effectCallbackDependencies` arg is used to indicate when a change should
    // invalidate the `effectCallback` reference. The eslint configuration for
    // `react-hooks/exhaustive-deps` will validate that the `effectCallback` and
    // `effectCallbackDependencies` args are in sync at the call site of
    // `useEffectNTimesWhen`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, condition, ...effectCallbackDependencies]);
}

export default useEffectNTimesWhen;
