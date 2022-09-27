import { useEffect } from 'react';
import { Evented, EventListener } from '@deephaven/jsapi-shim';
import Log from '@deephaven/log';

const log = Log.module('useClientListener');

export const useClientListener = (
  eventEmitter: Evented | undefined,
  eventName: string,
  callback: EventListener
): void =>
  useEffect(
    function initEventEmitter() {
      if (eventEmitter === undefined) {
        log.debug2('Emitter undefined, skipping addEventListener', eventName);
        return;
      }
      log.debug2('Adding listener', eventName);
      return eventEmitter.addEventListener(eventName, callback);
    },
    [eventEmitter, eventName, callback]
  );

export default useClientListener;
