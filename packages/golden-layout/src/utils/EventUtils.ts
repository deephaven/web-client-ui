import { useEffect } from 'react';
import EventEmitter from './EventEmitter';

type AsArray<P> = P extends unknown[] ? P : [P];

export type EventHandlerFunction<P = []> = (...parameters: AsArray<P>) => void;
export type EventListenerRemover = () => void;
export type EventListenFunction<TParameters = []> = (
  eventEmitter: EventEmitter,
  handler: EventHandlerFunction<TParameters>
) => EventListenerRemover;

export type EventEmitFunction<TParameters = []> = (
  eventEmitter: EventEmitter,
  ...parameters: AsArray<TParameters>
) => void;

export type EventListenerHook<TParameters = []> = (
  eventEmitter: EventEmitter,
  handler: EventHandlerFunction<TParameters>
) => void;

/**
 * Listen for an event
 * @param eventEmitter The event emitter to listen to
 * @param event The event to listen for
 * @param handler The handler to call when the event is emitted
 * @returns A function to stop listening for the event
 */
export function listenForEvent<TParameters = []>(
  eventEmitter: EventEmitter,
  event: string,
  handler: EventHandlerFunction<TParameters>
): EventListenerRemover {
  eventEmitter.on(event, handler);
  return () => {
    eventEmitter.off(event, handler);
  };
}

export function makeListenFunction<TParameters = []>(
  event: string
): EventListenFunction<TParameters> {
  return (eventEmitter, handler) =>
    listenForEvent(eventEmitter, event, handler);
}

export function makeEmitFunction<TParameters = []>(
  event: string
): EventEmitFunction<TParameters> {
  return (eventEmitter, ...parameters) => {
    eventEmitter.emit(event, ...parameters);
  };
}

export function makeUseListenerFunction<TParameters = []>(
  event: string
): EventListenerHook<TParameters> {
  return (eventEmitter, handler) => {
    useEffect(
      () => listenForEvent(eventEmitter, event, handler),
      [eventEmitter, handler]
    );
  };
}

/**
 * Create listener, emitter, and hook functions for an event
 * @param event Name of the event to create functions for
 * @returns Listener, Emitter, and Hook functions for the event
 */
export function makeEventFunctions<TParameters = []>(
  event: string
): {
  listen: EventListenFunction<TParameters>;
  emit: EventEmitFunction<TParameters>;
  useListener: EventListenerHook<TParameters>;
} {
  return {
    listen: makeListenFunction<TParameters>(event),
    emit: makeEmitFunction<TParameters>(event),
    useListener: makeUseListenerFunction<TParameters>(event),
  };
}
