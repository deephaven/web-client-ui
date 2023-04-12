/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
import { EventHandlerResult } from './EventHandlerResult';
import Grid from './Grid';
import { GridMouseEvent, GridPoint } from './GridTypes';

/**
 * Define a region in the grid that interacts with the mouse on a grid.
 * Return true from any of the events to indicate they're consumed, and stopPropagation/preventDefault will be called.
 */
export class GridMouseHandler {
  order: number;

  // What order this mouse handler should trigger in. Smaller numbers trigger first
  // Default to well below any of the GRID mouse handlers 100-1000+
  constructor(order = 5000) {
    this.order = order;
  }

  // Cursor to use if this returns any truthy value including { stopPropagation: false, preventDefault: false }
  cursor: string | null = null;

  onDown(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    return false;
  }

  onMove(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    return false;
  }

  onDrag(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    return false;
  }

  onLeave(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    return false;
  }

  onClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    return false;
  }

  onContextMenu(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    return false;
  }

  onDoubleClick(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    return false;
  }

  onUp(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    return false;
  }

  onWheel(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    return false;
  }
}

export default GridMouseHandler;
