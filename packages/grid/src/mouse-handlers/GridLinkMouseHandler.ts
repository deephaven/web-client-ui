/* eslint class-methods-use-this: "off" */

import clamp from 'lodash.clamp';
import { assertNotNull } from '@deephaven/utils';
import { isEditableGridModel } from '../EditableGridModel';
import { EventHandlerResult } from '../EventHandlerResult';
import Grid from '../Grid';
import GridMouseHandler, { GridMouseEvent } from '../GridMouseHandler';
import GridRange from '../GridRange';
import GridRenderer from '../GridRenderer';
import GridUtils, { GridPoint } from '../GridUtils';

export interface LinkInformation {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  value: string;
  href: string;
}

class GridLinkMouseHandler extends GridMouseHandler {
  timeoutId?: ReturnType<typeof setTimeout>;

  private isHold = false;

  private isDown = false;

  private static currentLinkBox?: LinkInformation;

  /**
   * Checks if mouse is currently over a link and returns its information if so
   * @param gridPoint Mouse position information
   * @param grid The grid
   * @returns A LinkInformation object if it exists and null otherwise
   */
  static getHoveringLinkInfo(
    gridPoint: GridPoint,
    grid: Grid
  ): LinkInformation | null {
    const { column, row, x, y } = gridPoint;
    const { props, canvasContext: context, renderer, metrics } = grid;
    const { model } = props;

    if (row == null || column == null) {
      return null;
    }

    // If cursor was already previously on a link, check saved link boundaries
    if (this.currentLinkBox) {
      const { left, top, right, bottom } = this.currentLinkBox;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return this.currentLinkBox;
      }
    }

    assertNotNull(context);
    assertNotNull(metrics);
    const modelRow = grid.getModelRow(row);
    const modelColumn = grid.getModelColumn(column);
    const renderState = grid.getRenderState();
    const theme = grid.getTheme();

    const text = model.textForCell(modelColumn, modelRow);
    const {
      width: textWidth,
      x: textX,
      y: textY,
    } = renderer.getTextRenderMetrics(context, renderState, column, row);
    const {
      fontWidths,
      gridX,
      gridY,
      width: gridWidth,
      height: gridHeight,
      verticalBarWidth,
      horizontalBarHeight,
    } = metrics;

    // Set the font and change it back after
    context.save();
    context.font = theme.font;

    const fontWidth =
      fontWidths.get(context.font) ?? GridRenderer.DEFAULT_FONT_WIDTH;
    const truncationChar = model.truncationCharForCell(modelColumn, modelRow);
    const truncatedText = GridRenderer.truncateToWidth(
      context,
      text,
      textWidth,
      fontWidth,
      truncationChar
    );

    const links = model.findLinksInVisibleText(text, truncatedText);

    // Check if the truncated text contains a link
    if (links.length > 0) {
      const {
        actualBoundingBoxAscent,
        actualBoundingBoxDescent,
      } = context.measureText(truncatedText);
      const linkHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;

      // Consider edge cases
      const top = Math.max(gridY, gridY + textY - linkHeight / 2);
      const bottom = clamp(
        top + linkHeight,
        top,
        gridHeight - horizontalBarHeight
      );

      // Loop through the blocks of text
      for (let i = 0; i < links.length; i += 1) {
        const { end, start, href } = links[i];
        let { value } = links[i];

        if (end > truncatedText.length) {
          value = truncatedText.substring(start);
        }

        let { width: linkWidth } = context.measureText(value);
        // Measure the width of the substring before the link
        const startX =
          context.measureText(truncatedText.substring(0, start)).width + textX;
        // Right side is greater than gridX
        const textIsVisible = startX + linkWidth >= gridX;

        if (textIsVisible) {
          // Check if the x position is less than the grid x, then linkWidth should be shifted by gridX - startX
          linkWidth -= startX < gridX ? gridX - startX : 0;

          const left = Math.max(gridX, gridX + startX);
          const right = clamp(
            left + linkWidth,
            left,
            gridWidth - verticalBarWidth
          );

          const cursorIsInBounds =
            x >= left && x <= right && y >= top && y <= bottom;

          if (cursorIsInBounds) {
            // Reset font
            context.restore();

            this.currentLinkBox = {
              left,
              top,
              right,
              bottom,
              width: linkWidth,
              height: linkHeight,
              value,
              href,
            };

            return this.currentLinkBox;
          }
        }
      }
    }

    // There are no links or the mouse is not on a link, restore context and currentLinkBox
    context.restore();
    this.currentLinkBox = undefined;

    return null;
  }

  /**
   * Set the cursor to pointer when hovering of a link
   * @param gridPoint Mouse position information
   * @param grid The grid
   * @returns False
   */
  private setCursor(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (GridLinkMouseHandler.getHoveringLinkInfo(gridPoint, grid) != null) {
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
    this.isDown = true;
    const link = GridLinkMouseHandler.getHoveringLinkInfo(gridPoint, grid);

    // If a modifier key or shift is down, we don't want to handle it and set isDown to false so onUp won't handle it either
    if (GridUtils.isModifierKeyDown(event) || event.shiftKey || link == null) {
      this.isDown = false;
      return false;
    }

    if (this.timeoutId) {
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
    }, 1000);

    return true;
  }

  onUp(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const link = GridLinkMouseHandler.getHoveringLinkInfo(gridPoint, grid);
    if (link == null || !this.isDown) {
      this.isDown = false;
      this.isHold = false;
      return false;
    }

    // Link is not null, isDown is true
    // If isHold is true, then the select already happened so onUp shouldn't do anything
    if (!this.isHold) {
      // Cancel the timeout and open a new tab with the link
      if (this.timeoutId != null) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = undefined;
      window.open(link.href, '_blank');
    }

    this.isHold = false;
    this.isDown = false;

    return true;
  }
}

export default GridLinkMouseHandler;
