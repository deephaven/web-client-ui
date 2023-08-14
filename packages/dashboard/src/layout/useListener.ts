import { useEffect } from 'react';
import type { EventEmitter } from '@deephaven/golden-layout';

/**
 * Listen for a specific event on an EventEmitter
 * @param eventEmitter EventEmitter to listen to
 * @param eventName Name of the event to listen to
 * @param callback Callback to call when the event is triggered
 */
export function useListener(
  eventEmitter: EventEmitter,
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function
): void {
  useEffect(
    function initEventEmitter() {
      eventEmitter.on(eventName, callback);

      return () => {
        eventEmitter.off(eventName, callback);
      };
    },
    [eventEmitter, eventName, callback]
  );
}

export default useListener;
