/* eslint class-methods-use-this: "off" */
import { assertNotNull } from '@deephaven/utils';
import * as linkify from 'linkifyjs';
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
  width: number;
  height: number;
  value: string;
  href: string;
}

class GridLinkMouseHandler extends GridMouseHandler {
  timeoutId: undefined | ReturnType<typeof setTimeout> = undefined;

  isHold = false;

  isDown = false;

  /**
   * Checks if mouse is currently over a link and returns its information if so
   * @param gridPoint Mouse position information
   * @param grid The grid
   * @returns A LinkInformation object if it exists and null otherwise
   */
  static isHoveringLink(
    gridPoint: GridPoint,
    grid: Grid
  ): LinkInformation | null {
    const { column, row, x, y } = gridPoint;
    const { props, canvasContext: context, renderer, metrics } = grid;
    const { model } = props;

    if (row == null || column == null) {
      return null;
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
    const prevFont = context.font;
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

    // Check if the truncated text contains a link
    if (linkify.find(truncatedText, 'url').length !== 0) {
      const tokenizedText = model.tokensForCell(truncatedText);
      const {
        actualBoundingBoxAscent,
        actualBoundingBoxDescent,
      } = context.measureText(truncatedText);
      const linkHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
      // The x position of the word
      let startX = textX;

      // Consider edge cases
      const top = Math.max(gridY, gridY + textY - linkHeight / 2);
      const bottom = Math.min(
        top + linkHeight,
        gridHeight - horizontalBarHeight
      );

      // Loop through the blocks of text
      for (let i = 0; i < tokenizedText.length; i += 1) {
        const { v: value } = tokenizedText[i];
        let { width: linkWidth } = context.measureText(value);

        // If the text is not visible (right side is less than gridX)
        if (startX + linkWidth < gridX) {
          startX += linkWidth;

          // eslint-disable-next-line no-continue
          continue;
        }

        // Check if the x position is less than the grid x, then startX will be negative so the linkWidth should be shifted
        linkWidth += startX < gridX ? startX : 0;

        const left = Math.max(gridX, gridX + startX);
        const right = Math.min(left + linkWidth, gridWidth - verticalBarWidth);

        // If the block is not a url, continue
        if (tokenizedText[i].t !== 'url') {
          startX = right;

          // eslint-disable-next-line no-continue
          continue;
        }

        if (x >= left && x <= right && y >= top && y <= bottom) {
          // Reset font
          context.font = prevFont;
          let fullLink = value;

          // If the link ends with ellipses, need to find the entire link in the original text otherwise it is truncated
          if (value.endsWith('…')) {
            const linkWithoutEllipses = value.substring(0, value.length - 1);
            const startIndexOfLink = text.indexOf(linkWithoutEllipses);
            const endIndexOfLink =
              text.indexOf(' ', startIndexOfLink) === -1
                ? text.length
                : text.indexOf(' ', startIndexOfLink);
            fullLink = text.substring(startIndexOfLink, endIndexOfLink);
          }
          return {
            left,
            top,
            width: linkWidth,
            height: linkHeight,
            value,
            href: linkify.find(fullLink)[0].href,
          };
        }

        startX = right;
      }
    }
    context.font = prevFont;

    return null;
  }

  /**
   * Set the cursor to pointer when hovering of a link
   * @param gridPoint Mouse position information
   * @param grid The grid
   * @returns False
   */
  private setCursor(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (GridLinkMouseHandler.isHoveringLink(gridPoint, grid) != null) {
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
    // If a modifier key or shift is down, we don't want to handle it and set isDown to false so onUp won't handle it either
    if (GridUtils.isModifierKeyDown(event) || event.shiftKey) {
      this.isDown = false;
      return false;
    }

    const link = GridLinkMouseHandler.isHoveringLink(gridPoint, grid);
    if (link != null) {
      this.isDown = true;
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
    this.isDown = false;
    return false;
  }

  onUp(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const link = GridLinkMouseHandler.isHoveringLink(gridPoint, grid);
    if (link != null && this.isDown) {
      this.isDown = false;

      // If isHold is true, then the select already happened so onUp shouldn't do anything
      if (this.isHold) {
        this.isHold = false;
      } else {
        // Cancel the timeout and open a new tab with the link
        if (this.timeoutId != null) {
          clearTimeout(this.timeoutId);
        }
        this.timeoutId = undefined;
        window.open(link.href, '_blank');
      }
      return true;
    }

    this.isDown = false;
    return false;
  }
}

export default GridLinkMouseHandler;
