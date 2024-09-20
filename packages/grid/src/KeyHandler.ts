/* eslint class-methods-use-this: "off" */
/* eslint @typescript-eslint/no-unused-vars: "off" */
/**
 * Handle keys in a grid
 * Return true from any of the events to indicate they're consumed, and stopPropagation/preventDefault will be called.
 */

import type React from 'react';
import { type EventHandlerResult } from './EventHandlerResult';
import type Grid from './Grid';

/**
 * Some events we listen to are a native keyboard event, and others are wrapped with React's SyntheticEvent.
 * The KeyHandler shouldn't care though - the properties it accesses should be common on both types of events.
 */
export type GridKeyboardEvent = KeyboardEvent | React.KeyboardEvent;

export type GridKeyHandlerFunctionName = 'onDown' | 'onUp';

export class KeyHandler {
  order: number;

  // What order this key handler should trigger in
  // Default to well below any of the GRID key handlers 100-1000+
  constructor(order = 5000) {
    this.order = order;
  }

  // Cursor to use if this returns any truthy value including { stopPropagation: false, preventDefault: false }
  cursor: string | null = null;

  /**
   * Handle a keydown event on the grid.
   * @param event The keyboard event
   * @param grid The grid component the key press is on
   * @returns Response indicating if the key was consumed
   */
  onDown(event: GridKeyboardEvent, grid: Grid): EventHandlerResult {
    return false;
  }

  /**
   * Handle a keyup event on the grid.
   * @param event The keyboard event
   * @param grid The grid component the key press is on
   * @returns Response indicating if the key was consumed
   */
  onUp(event: GridKeyboardEvent, grid: Grid): EventHandlerResult {
    return false;
  }
}

export default KeyHandler;
