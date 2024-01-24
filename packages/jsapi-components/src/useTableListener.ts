import { useEffect } from 'react';
import type { dh.HasEventHandling, EventListener } from '@deephaven/jsapi-types';
import Log from '@deephaven/log';

const log = Log.module('useTableListener');

export const useTableListener = <T = unknown>(
  eventEmitter: dh.HasEventHandling | undefined | null,
  eventName: string,
  callback: EventListener<T>
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
