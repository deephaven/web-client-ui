/**
 * A generic and very fast EventEmitter
 * implementation. On top of emitting the
 * actual event it emits an
 *
 * EventEmitter.ALL_EVENT
 *
 * event for every event triggered. This allows
 * to hook into it and proxy events forwards
 *
 * @constructor
 */
class EventEmitter {
  /**
   * The name of the event that's triggered for every other event
   *
   * usage
   *
   * myEmitter.on( EventEmitter.ALL_EVENT, function( eventName, argsArray ){
   * 	//do stuff
   * });
   */
  static ALL_EVENT = '__all';

  private _mSubscriptions: Record<string, { fn: Function; ctx?: unknown }[]>;

  constructor() {
    this._mSubscriptions = {};
    this._mSubscriptions[EventEmitter.ALL_EVENT] = [];
  }

  /**
   * Listen for events
   *
   * @param eventName The name of the event to listen to
   * @param callback The callback to execute when the event occurs
   * @param context The value of the this pointer within the callback function
   */
  on(eventName: string, callback: Function, context?: unknown): void {
    if (typeof callback !== 'function') {
      throw new Error(
        'Tried to listen to event ' +
          eventName +
          ' with non-function callback ' +
          callback
      );
    }

    if (!this._mSubscriptions[eventName]) {
      this._mSubscriptions[eventName] = [];
    }

    this._mSubscriptions[eventName].push({ fn: callback, ctx: context });
  }

  /**
   * Emit an event and notify listeners
   *
   * @param eventName The name of the event
   * @param args additional arguments that will be passed to the listener
   */
  emit(eventName: string, ...args: unknown[]) {
    const subs = this._mSubscriptions[eventName];

    if (subs) {
      for (let i = 0; i < subs.length; i++) {
        const ctx = subs[i].ctx || {};
        subs[i].fn.apply(ctx, args);
      }
    }

    args.unshift(eventName);

    const allEventSubs = this._mSubscriptions[EventEmitter.ALL_EVENT];

    for (let i = 0; i < allEventSubs.length; i++) {
      const ctx = allEventSubs[i].ctx || {};
      allEventSubs[i].fn.apply(ctx, args);
    }
  }

  /**
   * Removes a listener for an event, or all listeners if no callback and context is provided.
   *
   * @param eventName The name of the event
   * @param callback The previously registered callback method (optional)
   * @param context  The previously registered context (optional)
   */
  unbind(eventName: string, callback?: Function, context?: unknown) {
    if (!this._mSubscriptions[eventName]) {
      return;
    }

    let bUnbound = false;

    for (let i = 0; i < this._mSubscriptions[eventName].length; i++) {
      if (
        (!callback || this._mSubscriptions[eventName][i].fn === callback) &&
        (!context || context === this._mSubscriptions[eventName][i].ctx)
      ) {
        this._mSubscriptions[eventName].splice(i, 1);
        bUnbound = true;
      }
    }

    if (bUnbound === false) {
      throw new Error('Nothing to unbind for ' + eventName);
    }
  }

  /**
   * Alias for unbind
   */
  off = this.unbind;

  /**
   * Alias for emit
   */
  trigger = this.emit;
}

export default EventEmitter;
