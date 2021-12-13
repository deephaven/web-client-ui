/**
 * An options object can be returned as the result to control
 * if event.stopPropagation() and event.preventDefault() should be called
 */
export type EventHandlerResultOptions = {
  stopPropagation?: boolean;
  preventDefault?: boolean;
};

/**
 * Result from the event handler for an event.
 * Return `false` if the event should not be consumed,
 * `true` to consume the event and stopPropagation/preventDefault,
 * or an options object to consume and decide whether to stopPropagation
 * or preventDefault
 */
export type EventHandlerResult = boolean | EventHandlerResultOptions;
