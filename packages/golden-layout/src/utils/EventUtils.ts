import EventEmitter from './EventEmitter';
import { useEffect } from 'react';

export type EventListenerRemover = () => void;
export type EventListenFunction<TPayload = unknown> = (
  eventEmitter: EventEmitter,
  handler: (p: TPayload) => void
) => EventListenerRemover;

export type EventEmitFunction<TPayload = unknown> = (
  eventEmitter: EventEmitter,
  payload: TPayload
) => void;

export type EventListenerHook<TPayload = unknown> = (
  eventEmitter: EventEmitter,
  handler: (p: TPayload) => void
) => void;

/**
 * Listen for an event
 * @param eventEmitter The event emitter to listen to
 * @param event The event to listen for
 * @param handler The handler to call when the event is emitted
 * @returns A function to stop listening for the event
 */
export function listenForEvent<TPayload>(
  eventEmitter: EventEmitter,
  event: string,
  handler: (p: TPayload) => void
): EventListenerRemover {
  eventEmitter.on(event, handler);
  return () => {
    eventEmitter.off(event, handler);
  };
}

export function makeListenFunction<TPayload>(
  event: string
): EventListenFunction<TPayload> {
  return (eventEmitter, handler) =>
    listenForEvent(eventEmitter, event, handler);
}

export function makeEmitFunction<TPayload>(
  event: string
): EventEmitFunction<TPayload> {
  return (eventEmitter, payload) => {
    eventEmitter.emit(event, payload);
  };
}

export function makeUseListenerFunction<TPayload>(
  event: string
): EventListenerHook<TPayload> {
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
export function makeEventFunctions<TPayload>(event: string): {
  listen: EventListenFunction<TPayload>;
  emit: EventEmitFunction<TPayload>;
  useListener: EventListenerHook<TPayload>;
} {
  return {
    listen: makeListenFunction<TPayload>(event),
    emit: makeEmitFunction<TPayload>(event),
    useListener: makeUseListenerFunction<TPayload>(event),
  };
}
