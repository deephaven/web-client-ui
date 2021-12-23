import type { Event } from 'event-target-shim';

/**
 * A CustomEvent extension which combines the browser CustomEvent and event-target-shim's Event types for type safety
 * CustomEvent does not
 */
export class EventShimCustomEvent<
  T extends string,
  D = unknown
> extends CustomEvent<D> {
  type!: T;

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(typeArg: T, eventInitDict?: CustomEventInit<D>) {
    super(typeArg, eventInitDict);
  }
}

/**
 * Converts an event map into one using EventShimCustomEvent's so the event type only needs to be specified once
 * Takes an event map such as EventSourceEventMap from https://github.com/mysticatea/event-target-shim/blob/HEAD/docs/reference.md#example-3
 * This lets us specify the EventMap as just { onEvent: Event } rather than { onEvent: Event<'onEvent'> }
 */
export type CustomEventMap<M extends Record<string, Event>> = {
  [T in keyof M]: T extends string
    ? M[T] extends CustomEvent<infer D>
      ? EventShimCustomEvent<T, D>
      : M[T] extends Event
      ? Event<T>
      : never
    : never;
};
