/* eslint class-methods-use-this: "off" */
/* eslint no-unused-vars: "off" */
/**
 * Define a region in the grid that interacts with the mouse on a grid.
 * Return true from any of the events to indicate they're consumed, and stopPropagation/preventDefault will be called.
 */
class GridMouseHandler {
  static FUNCTION_NAMES = Object.freeze({
    DOWN: 'onDown',
    MOVE: 'onMove',
    DRAG: 'onDrag',
    LEAVE: 'onLeave',
    CLICK: 'onClick',
    CONTEXT_MENU: 'onContextMenu',
    DOUBLE_CLICK: 'onDoubleClick',
    UP: 'onUp',
    WHEEL: 'onWheel',
  });

  // What order this mouse handler should trigger in
  // Default to well below any of the GRID mouse handlers 100-1000+
  constructor(order = 5000) {
    this.order = order;
  }

  // Cursor to use if this returns true from any function
  cursor = null;

  onDown(gridPoint, grid, event) {
    return false;
  }

  onMove(gridPoint, grid, event) {
    return false;
  }

  onDrag(gridPoint, grid, event) {
    return false;
  }

  onLeave(gridPoint, grid, event) {
    return false;
  }

  onClick(gridPoint, grid, event) {
    return false;
  }

  onContextMenu(gridPoint, grid, event) {
    return false;
  }

  onDoubleClick(gridPoint, grid, event) {
    return false;
  }

  onUp(gridPoint, grid, event) {
    return false;
  }

  onWheel(gridPoint, grid, event) {
    return false;
  }
}

export default GridMouseHandler;
