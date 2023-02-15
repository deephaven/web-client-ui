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

    if (linkify.find(truncatedText, 'url').length !== 0) {
      const tokenizedText = model.tokensForCell(truncatedText);
      const {
        actualBoundingBoxAscent,
        actualBoundingBoxDescent,
      } = context.measureText(truncatedText);
      const linkHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
      let startX = textX;
      // check these values
      const top = Math.max(gridY, gridY + textY - linkHeight / 2);
      const bottom = Math.min(
        top + linkHeight,
        gridHeight - horizontalBarHeight
      );

      for (let i = 0; i < tokenizedText.length; i += 1) {
        const { v: value } = tokenizedText[i];
        let { width: linkWidth } = context.measureText(value);
        linkWidth += textX < gridX ? textX : 0;

        if (tokenizedText[i].t !== 'url') {
          startX += linkWidth;

          // eslint-disable-next-line no-continue
          continue;
        }

        const left = Math.max(gridX, startX);
        const right = Math.min(left + linkWidth, gridWidth - verticalBarWidth);

        if (x >= left && x <= right && y >= top && y <= bottom) {
          // debugger;
          context.font = prevFont;
          let fullLink = value;
          if (value.endsWith('…')) {
            const linkWithoutElipses = value.substring(0, value.length - 1);
            const startIndexOfLink = text.indexOf(linkWithoutElipses);
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
            value: tokenizedText[i].v,
            href: linkify.find(fullLink)[0].href,
          };
        }

        startX += linkWidth;
      }
    }
    context.font = prevFont;

    return null;
  }

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
      if (this.isHold) {
        this.isHold = false;
      } else {
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
