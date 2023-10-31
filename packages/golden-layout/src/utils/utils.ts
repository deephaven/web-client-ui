import $ from 'jquery';
import EventEmitter from './EventEmitter';

export function getHashValue(key: string) {
  var matches = location.hash.match(new RegExp(key + '=([^&]*)'));
  return matches ? matches[1] : null;
}

export function getQueryStringParam(param: string) {
  if (window.location.hash) {
    return getHashValue(param);
  } else if (!window.location.search) {
    return null;
  }

  var keyValuePairs = window.location.search.substr(1).split('&'),
    params: Record<string, string> = {},
    pair,
    i;

  for (i = 0; i < keyValuePairs.length; i++) {
    pair = keyValuePairs[i].split('=');
    params[pair[0]] = pair[1];
  }

  return params[param] || null;
}

export function animFrame(fn: (time?: number) => void) {
  return window.requestAnimationFrame(fn);
}

export function removeFromArray<T>(item: T, array: T[]) {
  var index = array.indexOf(item);

  if (index === -1) {
    throw new Error("Can't remove item from array. Item is not in the array");
  }

  array.splice(index, 1);
}

export function getUniqueId() {
  return (Math.random() * 1000000000000000).toString(36).replace('.', '');
}

/**
 * A basic XSS filter. It is ultimately up to the
 * implementing developer to make sure their particular
 * applications and usecases are save from cross site scripting attacks
 *
 * @param input
 * @param keepTags
 *
 * @returns filtered input
 */
export function filterXss(input: string, keepTags: boolean) {
  var output = input
    .replace(/javascript/gi, 'j&#97;vascript')
    .replace(/expression/gi, 'expr&#101;ssion')
    .replace(/onload/gi, 'onlo&#97;d')
    .replace(/script/gi, '&#115;cript')
    .replace(/onerror/gi, 'on&#101;rror');

  if (keepTags === true) {
    return output;
  } else {
    return output.replace(/>/g, '&gt;').replace(/</g, '&lt;');
  }
}

/**
 * Removes html tags from a string
 *
 * @param input
 *
 * @returns input without tags
 */
export function stripTags(input: string) {
  return $.trim(input.replace(/(<([^>]+)>)/gi, ''));
}

/**
 * Emit an event
 * @param emitter Emitter to emit the event on
 * @param name Name of the event
 * @param args Arguments to pass to the callback
 */
export function emitEvent<T extends readonly unknown[]>(
  emitter: EventEmitter,
  name: string,
  ...args: T
): void {
  emitter.emit(name, ...args);
}

export type OffFunction = () => void;

/**
 * Listen for an event
 *
 * @param emitter Event emitter to listen on
 * @param name Name of the event to listen to
 * @param callback Callback to call when the event is triggered
 * @returns A cleanup function to remove the listener
 */
export function onEvent<T extends readonly unknown[]>(
  emitter: EventEmitter,
  name: string,
  callback: (...args: T) => void
): OffFunction {
  emitter.on(name, callback);
  return () => {
    emitter.off(name, callback);
  };
}

/**
 * Stop listening for an event
 *
 * @param emitter Event emitter to listen on
 * @param name Name of the event to listen to
 * @param callback Callback to call when the event is triggered
 * @returns A cleanup function to remove the listener
 */
export function offEvent<T extends readonly unknown[]>(
  emitter: EventEmitter,
  name: string,
  callback: (...args: T) => void
): void {
  emitter.off(name, callback);
}

export type EmitListenerPair<T extends readonly unknown[]> = {
  emit: (emitter: EventEmitter, ...args: T) => void;
  on: (emitter: EventEmitter, callback: (...args: T) => void) => OffFunction;
};

/**
 * Get an emit and listen function pair for a given event name.
 * Note that this does not provide good docs for the functions.
 * For proper docs, create your own functions with docs that call #emitEvent and #onEvent.
 *
 * @param name Name of the event to emit and listen for
 * @returns An object with emit and listen functions, that just take the name of the event and args/callback respectively
 */
export function getEmitListenerPair<T extends readonly unknown[] = []>(
  name: string
): EmitListenerPair<T> {
  return {
    emit: function (emitter: EventEmitter, ...args: T) {
      emitEvent(emitter, name, ...args);
    },
    on: function (emitter: EventEmitter, callback: (...args: T) => void) {
      return onEvent(emitter, name, callback);
    },
  };
}
