/* eslint class-methods-use-this: "off" */

import { getOrThrow } from '@deephaven/utils';
import { isEditableGridModel } from '../EditableGridModel';
import { EventHandlerResult } from '../EventHandlerResult';
import Grid from '../Grid';
import GridMouseHandler, { GridMouseEvent } from '../GridMouseHandler';
import GridRange from '../GridRange';
import GridUtils, { GridPoint, isLinkToken, TokenBox } from '../GridUtils';
import { isTokenBoxCellRenderer } from '../TokenBoxCellRenderer';

class GridTokenMouseHandler extends GridMouseHandler {
  timeoutId?: ReturnType<typeof setTimeout>;

  private isHold = false;

  private isDown = false;

  // Stores the current hovered token box if it exists with translated coordinates
  private currentLinkBox?: TokenBox;

  private static HOLD_LENGTH = 1000;

  isHoveringLink(gridPoint: GridPoint, grid: Grid): boolean {
    const { column, row, x, y } = gridPoint;
    const { renderer, metrics, props } = grid;
    const { model } = props;

    if (column == null || row == null || metrics == null) {
      this.currentLinkBox = undefined;
      return false;
    }

    const { modelRows, modelColumns } = metrics;
    const modelRow = getOrThrow(modelRows, row);
    const modelColumn = getOrThrow(modelColumns, column);

    const cellRendererType = model.rendererForCell(modelColumn, modelRow);
    const cellRenderer = renderer.getCellRenderer(cellRendererType);
    if (!isTokenBoxCellRenderer(cellRenderer)) {
      return false;
    }

    if (this.currentLinkBox != null) {
      const { x1: left, y1: top, x2: right, y2: bottom } = this.currentLinkBox;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return true;
      }
    }

    const renderState = grid.updateRenderState();

    const tokensInCell = cellRenderer.getTokenBoxesForVisibleCell(
      column,
      row,
      renderState
    );

    // Loop through each link and check if cursor is in bounds
    for (let i = 0; i < tokensInCell.length; i += 1) {
      if (isLinkToken(tokensInCell[i].token)) {
        const translatedTokenBox = GridUtils.translateTokenBox(
          tokensInCell[i],
          metrics
        );
        const { x1: left, x2: right, y1: top, y2: bottom } = translatedTokenBox;
        if (x >= left && x <= right && y >= top && y <= bottom) {
          this.currentLinkBox = translatedTokenBox;
          return true;
        }
      }
    }

    // If this point is reached, that means the cursor was not hovering any of the links or there are no links
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
