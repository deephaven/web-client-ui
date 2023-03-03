/* eslint class-methods-use-this: "off" */

import { isEditableGridModel } from '../EditableGridModel';
import { EventHandlerResult } from '../EventHandlerResult';
import Grid from '../Grid';
import GridMouseHandler, { GridMouseEvent } from '../GridMouseHandler';
import GridRange from '../GridRange';
import GridUtils, { GridPoint, TokenBox } from '../GridUtils';

class GridTokenMouseHandler extends GridMouseHandler {
  timeoutId?: ReturnType<typeof setTimeout>;

  private isHold = false;

  private isDown = false;

  private currentLinkBox?: TokenBox;

  private static HOLD_LENGTH = 1000;

  isHoveringLink(gridPoint: GridPoint, grid: Grid): boolean {
    const { column, row, x, y } = gridPoint;
    if (column == null || row == null) {
      this.currentLinkBox = undefined;
      return false;
    }

    if (this.currentLinkBox != null) {
      const { x1: left, y1: top, x2: right, y2: bottom } = this.currentLinkBox;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return true;
      }
    }

    const { metricCalculator, renderer } = grid;
    const metricState = grid.getMetricState();
    const renderState = grid.getRenderState();
    const linksInCell = metricCalculator.getTokenBoxesForVisibleCell(
      column,
      row,
      metricState,
      renderer,
      renderState
    );

    // If there are no links in the cell, return false
    if (linksInCell == null) {
      this.currentLinkBox = undefined;
      return false;
    }

    // Loop through each link and check if cursor is in bounds
    for (let i = 0; i < linksInCell.length; i += 1) {
      const { x1: left, x2: right, y1: top, y2: bottom } = linksInCell[i];
      if (x >= left && x <= right && y >= top && y <= bottom) {
        this.currentLinkBox = linksInCell[i];
        return true;
      }
    }

    // If this point is reached, that means the cursor was not hovering any of the links
    this.currentLinkBox = undefined;
    return false;
  }

  /**
   * Set the cursor to pointer when hovering over a link
   * @param gridPoint Mouse position information
   * @param grid The grid
   * @returns False
   */
  private setCursor(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (this.isHoveringLink(gridPoint, grid)) {
      this.cursor = 'pointer';
    } else {
      this.cursor = null;
    }
    return false;
  }

  onMove(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    return this.setCursor(gridPoint, grid);
  }

  onDown(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    const isUserHoveringLink = this.isHoveringLink(gridPoint, grid);

    // If a modifier key or shift is down, we don't want to handle it and set isDown to false so onUp won't handle it either
    if (
      GridUtils.isModifierKeyDown(event) ||
      event.shiftKey ||
      !isUserHoveringLink
    ) {
      return false;
    }

    this.isDown = true;

    if (this.timeoutId != null) {
      clearTimeout(this.timeoutId);
    }
    this.isHold = false;
    this.timeoutId = setTimeout(() => {
      this.isHold = true;
      const { column, row } = gridPoint;
      const { model } = grid.props;

      // After 1 second, select the row and if it is an input table, start editing
      grid.clearSelectedRanges();
      grid.focus();
      grid.moveCursorToPosition(column, row);
      if (
        isEditableGridModel(model) &&
        column != null &&
        row != null &&
        model.isEditableRange(GridRange.makeCell(column, row))
      ) {
        grid.startEditing(column, row);
      }
    }, GridTokenMouseHandler.HOLD_LENGTH);

    return true;
  }

  onClick(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const isUserHoveringLink = this.isHoveringLink(gridPoint, grid);

    if (!isUserHoveringLink || !this.isDown || this.currentLinkBox == null) {
      this.isDown = false;
      this.isHold = false;
      return false;
    }

    // User is hovering a link, isDown is true
    // If isHold is true, then the select already happened so onUp shouldn't do anything
    if (!this.isHold) {
      // Cancel the timeout and open a new tab with the link
      if (this.timeoutId != null) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = undefined;
      grid.props.onTokenClicked(this.currentLinkBox?.token);
    }

    this.isHold = false;
    this.isDown = false;

    return true;
  }
}

export default GridTokenMouseHandler;
