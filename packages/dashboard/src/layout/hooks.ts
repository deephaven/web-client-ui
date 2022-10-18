import { useEffect } from 'react';
import type { EventEmitter } from '@deephaven/golden-layout';

export const useListener = (
  eventEmitter: EventEmitter,
  eventName: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function
): void =>
  useEffect(
    function initEventEmitter() {
      eventEmitter.on(eventName, callback);

      return () => {
        eventEmitter.off(eventName, callback);
      };
    },
    [eventEmitter, eventName, callback]
  );

export default { useListener };
