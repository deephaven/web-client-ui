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
) {
  const isMountedRef = useIsMountedRef();
  const trackingRef = useRef({ count: 0, started: Date.now() });
  const setTimeoutRef = useRef(0);

  const tick = useCallback(async () => {
    const now = Date.now();
    let elapsedSinceLastTick = now - trackingRef.current.started;

    trackingRef.current.count += 1;
    trackingRef.current.started = now;

    log.debug(
      `tick #${trackingRef.current.count}.`,
      elapsedSinceLastTick,
      'ms elapsed since last tick.'
    );

    await callback();

    if (!isMountedRef.current) {
      return;
    }

    elapsedSinceLastTick += Date.now() - trackingRef.current.started;

    // If elapsed time is > than the target interval, adjust the next tick interval
    const nextTickInterval = Math.max(
      0,
      Math.min(
        targetIntervalMs,
        targetIntervalMs - (elapsedSinceLastTick - targetIntervalMs)
      )
    );

    log.debug('adjusted minIntervalMs:', nextTickInterval);

    setTimeoutRef.current = window.setTimeout(tick, nextTickInterval);
  }, [callback, isMountedRef, targetIntervalMs]);

  useEffect(() => {
    log.debug('Setting interval minIntervalMs:', targetIntervalMs);

    setTimeoutRef.current = window.setTimeout(tick, targetIntervalMs);

    return () => {
      window.clearTimeout(setTimeoutRef.current);
    };
  }, [targetIntervalMs, tick]);
}

export default useAsyncInterval;
