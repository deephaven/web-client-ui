/* eslint class-methods-use-this: "off" */
/* eslint @typescript-eslint/no-unused-vars: "off" */
/**
 * Handle keys in a grid
 * Return true from any of the events to indicate they're consumed, and stopPropagation/preventDefault will be called.
 */

// eslint-disable-next-line import/no-cycle
import { KeyboardEvent } from 'react';
import Grid from './Grid';

/**
 * An options object can be returned as the result to control
 * if event.stopPropagation() and event.preventDefault() should be called
 */
export type KeyHandlerResultOptions = {
  stopPropagation?: boolean;
  preventDefault?: boolean;
};

/**
 * Result from the key handler for an event.
 * Return `false` to pass the event on, otherwise the event is consumed.
 */
export type KeyHandlerResult = boolean | KeyHandlerResultOptions;

class KeyHandler {
  order: number;

  // What order this key handler should trigger in
  // Default to well below any of the GRID key handlers 100-1000+
  constructor(order = 5000) {
    this.order = order;
  }

  /**
   * Handle a keydown event on the grid.
   * @param event The keyboard event
   * @param grid The grid component the key press is on
   * @returns Response indicating if the key was consumed
   */
  onDown(event: KeyboardEvent, grid: Grid): KeyHandlerResult {
    return false;
  }
}

export default KeyHandler;
