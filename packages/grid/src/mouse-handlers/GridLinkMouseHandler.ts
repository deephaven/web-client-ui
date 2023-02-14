/* eslint class-methods-use-this: "off" */
import { assertNotNull } from '@deephaven/utils';
import * as linkify from 'linkifyjs';
import { EventHandlerResult } from '../EventHandlerResult';
import Grid from '../Grid';
import GridMouseHandler, { GridMouseEvent } from '../GridMouseHandler';
import GridRenderer from '../GridRenderer';
import { GridPoint } from '../GridUtils';

class GridLinkMouseHandler extends GridMouseHandler {
  timeoutId: undefined | ReturnType<typeof setTimeout> = undefined;

  isHold = false;

  static isHoveringLink(gridPoint: GridPoint, grid: Grid): string | null {
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
    const prevFont = context.font;

    if (linkify.find(truncatedText, 'url').length !== 0) {
      const tokenizedText = model.tokensForCell(truncatedText);
      context.font = theme.font;
      const {
        actualBoundingBoxAscent,
        actualBoundingBoxDescent,
      } = context.measureText(truncatedText);
      const linkHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;
      // check these values
      const left = Math.max(gridX, textX);
      const top = Math.max(gridY, gridY + textY - linkHeight / 2);
      for (let i = 0; i < tokenizedText.length; i += 1) {
        let { width: linkWidth } = context.measureText(tokenizedText[i].v);
        linkWidth += textX < gridX ? textX : 0;

        const right = Math.min(left + linkWidth, gridWidth - verticalBarWidth);
        const bottom = Math.min(
          top + linkHeight,
          gridHeight - horizontalBarHeight
        );

        // if (tokenizedText[i].t === 'url') {
        //   // console.log(tokenizedText[i].v);
        //   // console.log('gridX: ', gridX);
        //   // console.log('gridY: ', gridY);
        //   // console.log(context);
        //   console.log('x y', x, y);
        //   console.log('textX: ', textX);
        //   console.log('linkWidth: ', linkWidth);
        //   console.log('left top right bottom', left, top, right, bottom);
        // }

        if (x >= left && x <= right && y >= top && y <= bottom) {
          return tokenizedText[i].v;
        }
      }
      context.font = prevFont;
    }

    return null;
  }

  private setCursor(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    if (GridLinkMouseHandler.isHoveringLink(gridPoint, grid) != null) {
      this.cursor = 'pointer';
      return { stopPropagation: false, preventDefault: false };
    }
    this.cursor = null;
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
    const link = GridLinkMouseHandler.isHoveringLink(gridPoint, grid);
    if (link != null) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.isHold = false;
      this.timeoutId = setTimeout(() => {
        this.isHold = true;
        const { column, row } = gridPoint;
        grid.clearSelectedRanges();
        grid.focus();
        grid.moveCursorToPosition(column, row);
        this.setCursor(gridPoint, grid);
      }, 1000);
      return true;
    }
    return false;
  }

  onUp(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const link = GridLinkMouseHandler.isHoveringLink(gridPoint, grid);
    if (link != null) {
      if (this.isHold) {
        this.isHold = false;
      } else {
        assertNotNull(this.timeoutId);
        clearTimeout(this.timeoutId);
        this.timeoutId = undefined;
        const { href } = linkify.find(link)[0];

        window.open(href, '_blank');
      }
      return true;
    }
    return false;
  }
}

export default GridLinkMouseHandler;
