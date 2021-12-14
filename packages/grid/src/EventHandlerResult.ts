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
 * Return one of the following:
 * - `false` if the event was not consumed and should be passed to other registered grid event handlers
 * - `true` to stop the event from being passed along to other registered grid event handlers, as well as call event.stopPropagation() and event.preventDefault()
 * - An `EventHandlerResultOptions` object to stop the event from being passed along to other registered grid event handlers, and decide whether to call event.stopPropagation() and/or event.preventDefault()
 */
export type EventHandlerResult = boolean | EventHandlerResultOptions;
