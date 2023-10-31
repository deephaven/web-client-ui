import { useEffect } from 'react';
import type { EventEmitter } from '@deephaven/golden-layout';

/**
 * Listen for a specific event on an EventEmitter.
 * Will not add listener if callback is not specified.
 * @param eventEmitter EventEmitter to listen to
 * @param eventName Name of the event to listen to
 * @param callback Callback to call when the event is triggered
 */
export function useOptionalListener<T extends unknown[]>(
  eventEmitter: EventEmitter,
  eventName: string,
  callback?: (...args: T) => void
): void {
  useEffect(
    function initEventEmitter() {
      if (callback == null) {
        return;
      }

      eventEmitter.on(eventName, callback);

      return () => {
        eventEmitter.off(eventName, callback);
      };
    },
    [eventEmitter, eventName, callback]
  );
}

export default useOptionalListener;
