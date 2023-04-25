import { useEffect } from 'react';
import { Evented, EventListener } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

const log = Log.module('useTableListener');

export const useTableListener = (
  eventEmitter: Evented | undefined | null,
  eventName: string,
  callback: EventListener
): void =>
  useEffect(
    function initEventEmitter() {
      if (eventEmitter == null) {
        log.debug2('Emitter undefined, skipping addEventListener', eventName);
        return;
      }
      log.debug2('Adding listener', eventName);
      return eventEmitter.addEventListener(eventName, callback);
    },
    [eventEmitter, eventName, callback]
  );

export default useTableListener;
