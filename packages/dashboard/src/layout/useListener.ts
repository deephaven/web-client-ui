import type { EventEmitter } from '@deephaven/golden-layout';
import useOptionalListener from './useOptionalListener';

/**
 * Listen for a specific event on an EventEmitter
 * @param eventEmitter EventEmitter to listen to
 * @param eventName Name of the event to listen to
 * @param callback Callback to call when the event is triggered
 */
export function useListener<T extends unknown[]>(
  eventEmitter: EventEmitter,
  eventName: string,
  callback: (...args: T) => void
): void {
  if (callback == null) {
    throw new Error('Callback must be specified');
  }
  useOptionalListener(eventEmitter, eventName, callback);
}

export default useListener;
