import { useCallback, useEffect, useRef } from 'react';
import Log from '@deephaven/log';
import { useIsMountedRef } from './useIsMountedRef';

const log = Log.module('useAsyncInterval');

/**
 * Calls the given async callback at a target interval.
 *
 * If the callback takes less time than the target interval, the target interval
 * for the next tick will be adjusted to target the remaining time in the current
 * interval.
 *
 * e.g. If the target interval is 1000ms, and the callback takes 50ms to resolve,
 * the next tick will be scheduled for 950ms from now via `setTimeout(callback, 950)`.
 *
 * If the callback takes longer than the target interval, the next tick will be
 * scheduled immediately via `setTimeout(callback, 0)`. In such cases, the time
 * between ticks may be > than the target interval, but this guarantees that
 * a callback won't be scheduled until after the previous one has resolved.
 * @param callback Callback to call at the target interval
 * @param targetIntervalMs Target interval in milliseconds to call the callback
 */
export function useAsyncInterval(
  callback: () => Promise<void>,
  targetIntervalMs: number
): void {
  const isMountedRef = useIsMountedRef();
  const setTimeoutRef = useRef(0);
  const trackingCountRef = useRef(0);
  const trackingStartedRef = useRef<number | null>(null);

  const tick = useCallback(async () => {
    const now = Date.now();
    trackingCountRef.current += 1;

    // If this is our first tick, treat it as if we've already waited the full
    // interval, otherwise calculate the elapsed time since the last tick
    let elapsedSinceLastTick =
      trackingStartedRef.current == null
        ? targetIntervalMs
        : now - trackingStartedRef.current;

    log.debug(
      `tick #${trackingCountRef.current}.`,
      elapsedSinceLastTick,
      'ms elapsed since last tick.'
    );

    trackingStartedRef.current = now;

    await callback();

    if (!isMountedRef.current) {
      return;
    }

    elapsedSinceLastTick += Date.now() - trackingStartedRef.current;

    // Calculate any elapsed time beyond the target interval.
    const overage = Math.max(0, elapsedSinceLastTick - targetIntervalMs);

    const nextTickInterval = Math.max(0, targetIntervalMs - overage);

    log.debug(
      'Next tick target:',
      targetIntervalMs,
      ', overage',
      overage,
      ', adjusted:',
      nextTickInterval
    );

    setTimeoutRef.current = window.setTimeout(tick, nextTickInterval);
  }, [callback, isMountedRef, targetIntervalMs]);

  useEffect(() => {
    log.debug('Setting target interval:', targetIntervalMs);

    trackingStartedRef.current = null;
    tick();

    return () => {
      window.clearTimeout(setTimeoutRef.current);
    };
  }, [targetIntervalMs, tick]);
}

export default useAsyncInterval;
