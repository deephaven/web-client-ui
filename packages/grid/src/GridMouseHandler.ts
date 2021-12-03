/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import { MouseEvent } from 'react';
import Grid from './Grid';
import { GridPoint } from './GridUtils';

/**
 * An options object can be returned as the result to control
 * if event.stopPropagation() and event.preventDefault() should be called
 */
export type GridMouseHandlerResultOptions = {
  stopPropagation?: boolean;
  preventDefault?: boolean;
};
/**
 * Result from the mouse handler for an event.
 * Return `false` to pass the event on, otherwise the event is consumed.
 */
export type GridMouseHandlerResult = boolean | GridMouseHandlerResultOptions;

export type GridMouseHandlerFunctionName =
  | 'onDown'
  | 'onMove'
  | 'onDrag'
  | 'onLeave'
  | 'onClick'
  | 'onContextMenu'
  | 'onDoubleClick'
  | 'onUp'
  | 'onWheel';

/**
 * Define a region in the grid that interacts with the mouse on a grid.
 * Return true from any of the events to indicate they're consumed, and stopPropagation/preventDefault will be called.
 */
export class GridMouseHandler {
  order: number;

  // What order this mouse handler should trigger in
  // Default to well below any of the GRID mouse handlers 100-1000+
  constructor(order = 5000) {
    this.order = order;
  }

  // Cursor to use if this returns true from any function
  cursor: string | null = null;

  onDown(
    gridPoint: GridPoint,
    grid: Grid,
    event: MouseEvent
  ): GridMouseHandlerResult {
    return false;
  }

  onMove(
    gridPoint: GridPoint,
    grid: Grid,
    event: MouseEvent
  ): GridMouseHandlerResult {
    return false;
  }

  onDrag(
    gridPoint: GridPoint,
    grid: Grid,
    event: MouseEvent
  ): GridMouseHandlerResult {
    return false;
  }

  onLeave(
    gridPoint: GridPoint,
    grid: Grid,
    event: MouseEvent
  ): GridMouseHandlerResult {
    return false;
  }

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: MouseEvent
  ): GridMouseHandlerResult {
    return false;
  }

  onContextMenu(
    gridPoint: GridPoint,
    grid: Grid,
    event: MouseEvent
  ): GridMouseHandlerResult {
    return false;
  }

  onDoubleClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: MouseEvent
  ): GridMouseHandlerResult {
    return false;
  }

  onUp(
    gridPoint: GridPoint,
    grid: Grid,
    event: MouseEvent
  ): GridMouseHandlerResult {
    return false;
  }

  onWheel(
    gridPoint: GridPoint,
    grid: Grid,
    event: MouseEvent
  ): GridMouseHandlerResult {
    return false;
  }
}

export default GridMouseHandler;
