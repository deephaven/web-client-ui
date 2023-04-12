/* eslint class-methods-use-this: "off" */
/* eslint @typescript-eslint/no-unused-vars: "off" */
/**
 * Handle keys in a grid
 * Return true from any of the events to indicate they're consumed, and stopPropagation/preventDefault will be called.
 */

import React from 'react';
import { EventHandlerResult } from './EventHandlerResult';
import type Grid from './Grid';
import { GridKeyboardEvent } from './GridTypes';

export class KeyHandler {
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
  onDown(event: GridKeyboardEvent, grid: Grid): EventHandlerResult {
    return false;
  }
}

export default KeyHandler;
