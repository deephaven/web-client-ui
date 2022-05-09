import { useEffect } from 'react';
import GoldenLayout from '@deephaven/golden-layout';

export const useListener = (
  eventEmitter: GoldenLayout.EventEmitter,
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
