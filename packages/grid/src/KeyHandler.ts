/* eslint class-methods-use-this: "off" */
/* eslint @typescript-eslint/no-unused-vars: "off" */
/**
 * Handle keys in a grid
 * Return true from any of the events to indicate they're consumed, and stopPropagation/preventDefault will be called.
 */

// eslint-disable-next-line import/no-cycle
import { KeyboardEvent } from 'react';
import Grid from './Grid';

// True if consumed and to stop event propagation/prevent default, false if not consumed.
// OR an object if consumed with boolean properties to control whether to stopPropagation/preventDefault
export type KeyHandlerResponseOptions = {
  stopPropagation?: boolean;
  preventDefault?: boolean;
};
export type KeyHandlerResponse = boolean | KeyHandlerResponseOptions;

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
  onDown(event: KeyboardEvent, grid: Grid): KeyHandlerResponse {
    return false;
  }
}

export default KeyHandler;
