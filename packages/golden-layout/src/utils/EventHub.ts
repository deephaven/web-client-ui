import $ from 'jquery';
import type LayoutManager from '../LayoutManager';
import EventEmitter from './EventEmitter';

interface GoldenLayoutEvent extends Event {
  __glArgs: [string, ...unknown[]];
  __gl: LayoutManager;
}

/**
 * An EventEmitter singleton that propagates events
 * across multiple windows. This is a little bit trickier since
 * windows are allowed to open childWindows in their own right
 *
 * This means that we deal with a tree of windows. Hence the rules for event propagation are:
 *
 * - Propagate events from this layout to both parents and children
 * - Propagate events from parent to this and children
 * - Propagate events from children to the other children (but not the emitting one) and the parent
 */
class EventHub extends EventEmitter {
  private _layoutManager: LayoutManager;

  private _dontPropagateToParent: string | null;

  private _childEventSource: LayoutManager | null;

  private _boundOnEventFromChild: (event: JQuery.TriggeredEvent) => void;

  constructor(layoutManager: LayoutManager) {
    super();
    this._layoutManager = layoutManager;
    this._dontPropagateToParent = null;
    this._childEventSource = null;
    this.on(EventEmitter.ALL_EVENT, this._onEventFromThis.bind(this));
    this._boundOnEventFromChild = this._onEventFromChild.bind(this);
    $(window).on('gl_child_event', this._boundOnEventFromChild);
  }

  /**
   * Called on every event emitted on this eventHub, regardles of origin.
   */
  private _onEventFromThis(...args: [string, ...unknown[]]) {
    if (
      this._layoutManager.isSubWindow &&
      args[0] !== this._dontPropagateToParent
    ) {
      this._propagateToParent(args);
    }
    this._propagateToChildren(args);

    //Reset
    this._dontPropagateToParent = null;
    this._childEventSource = null;
  }

  /**
   * Called by the parent layout.
   *
   * @param args Event name + arguments
   */
  private _$onEventFromParent(args: [string, ...unknown[]]) {
    this._dontPropagateToParent = args[0];
    this.emit.apply(this, args);
  }

  /**
   * Callback for child events raised on the window
   *
   * @param event
   */
  private _onEventFromChild(event: JQuery.TriggeredEvent) {
    this._childEventSource = (event.originalEvent as GoldenLayoutEvent).__gl;
    this.emit.apply(this, (event.originalEvent as GoldenLayoutEvent).__glArgs);
  }

  /**
   * Propagates the event to the parent by emitting
   * it on the parent's DOM window
   *
   * @param args Event name + arguments
   */
  private _propagateToParent(args: [string, ...unknown[]]) {
    const eventName = 'gl_child_event';

    const event = window.opener?.document.createEvent('HTMLEvents');
    event.initEvent(eventName, true, true);

    event.eventName = eventName;
    event.__glArgs = args;
    event.__gl = this._layoutManager;

    window.opener.dispatchEvent(event);
  }

  /**
   * Propagate events to children
   *
   * @param args Event name + arguments
   */
  private _propagateToChildren(args: [string, ...unknown[]]) {
    for (let i = 0; i < this._layoutManager.openPopouts.length; i++) {
      const childGl = this._layoutManager.openPopouts[i].getGlInstance();

      if (childGl && childGl !== this._childEventSource) {
        childGl.eventHub._$onEventFromParent(args);
      }
    }
  }

  /**
   * Destroys the EventHub
   */
  destroy() {
    $(window).off('gl_child_event', this._boundOnEventFromChild);
  }
}

export default EventHub;
