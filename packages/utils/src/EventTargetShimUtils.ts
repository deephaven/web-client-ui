import type { Event, EventTarget } from 'event-target-shim';

/**
 * A CustomEvent extension which combines the browser CustomEvent and event-target-shim's Event types for type safety
 * CustomEvent does not have a generic type and augmenting the dom types seemed like not the best idea
 */
export class EventShimCustomEvent<
  T extends string,
  D = unknown,
> extends CustomEvent<D> {
  // The fields declared are so TS plays nicely w/ event-target-shim and the browser CustomEvent
  // They don't actually do anything other than tell TS to not complain that they aren't set in the constructor
  // If declare is removed, then the properties are initialized to undefined which breaks this class
  // This will be the default for tsc and babel at some point
  // https://github.com/babel/babel/issues/12128#issuecomment-702119272
  declare type: T;

  declare target: EventTarget | null;

  declare srcElement: EventTarget | null;

  declare currentTarget: EventTarget | null;

  declare composedPath: () => EventTarget[];

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
export type CustomEventMap<M extends Record<string, Event | CustomEvent>> = {
  [T in keyof M]: T extends string
    ? M[T] extends CustomEvent<infer D>
      ? EventShimCustomEvent<T, D>
      : M[T] extends Event
      ? Event<T>
      : never
    : never;
};
