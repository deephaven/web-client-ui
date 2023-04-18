/* eslint-disable class-methods-use-this */
import { EMPTY_ARRAY, getOrThrow } from '@deephaven/utils';
import CellRenderer from './CellRenderer';
import { isExpandableGridModel } from './ExpandableGridModel';
import { VisibleIndex } from './GridMetrics';
import GridRenderer, { GridRenderState } from './GridRenderer';
import GridUtils, { TokenBox, Token } from './GridUtils';
import memoizeClear from './memoizeClear';

class TextCellRenderer extends CellRenderer {
  drawCellContent(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex,
    textOverride?: string
  ): void {
    const { metrics, model, theme } = state;
    const {
      fontWidths,
      modelColumns,
      modelRows,
      allRowHeights,
      firstColumn,
    } = metrics;
    const isFirstColumn = column === firstColumn;
    const { textColor } = theme;
    const rowHeight = getOrThrow(allRowHeights, row);
    const modelRow = getOrThrow(modelRows, row);
    const modelColumn = getOrThrow(modelColumns, column);
    const text = textOverride ?? model.textForCell(modelColumn, modelRow);
    const truncationChar = model.truncationCharForCell(modelColumn, modelRow);

    if (text && rowHeight > 0) {
      const textAlign = model.textAlignForCell(modelColumn, modelRow) || 'left';
      context.textAlign = textAlign;

      const color =
        model.colorForCell(modelColumn, modelRow, theme) || textColor;
      context.fillStyle = color;

      context.save();

      const {
        width: textWidth,
        x: textX,
        y: textY,
      } = GridUtils.getTextRenderMetrics(state, column, row);

      const fontWidth =
        fontWidths.get(context.font) ?? GridRenderer.DEFAULT_FONT_WIDTH;
      const truncatedText = this.getCachedTruncatedString(
        context,
        text,
        textWidth,
        fontWidth,
        truncationChar
      );

      const tokens = model.tokensForCell(
        modelColumn,
        modelRow,
        truncatedText.length
      );

      if (truncatedText) {
        let tokenIndex = 0;
        let textStart = 0;
        let left = textX;
        const { actualBoundingBoxDescent } = context.measureText(truncatedText);

        while (textStart < truncatedText.length) {
          const nextToken = tokens[tokenIndex];
          const token = textStart === nextToken?.start ? nextToken : null;
          const textEnd =
            token?.end ?? nextToken?.start ?? truncatedText.length;
          const value = truncatedText.substring(textStart, textEnd);
          const { width } = context.measureText(value);
          const widthOfUnderline = value.endsWith('…')
            ? context.measureText(value.substring(0, value.length - 1)).width
            : width;

          // Set the styling based on the token, then draw the text
          if (token != null) {
            context.fillStyle = theme.hyperlinkColor;
            context.fillText(value, left, textY);
            context.fillRect(
              left,
              textY + actualBoundingBoxDescent,
              widthOfUnderline,
              1
            );
          } else {
            context.fillStyle = color;
            context.fillText(value, left, textY);
          }

          left += width;
          textStart = textEnd;
          if (token != null) tokenIndex += 1;
        }
      }
      context.restore();
    }

    if (
      isFirstColumn &&
      isExpandableGridModel(model) &&
      model.hasExpandableRows
    ) {
      this.drawCellRowTreeMarker(context, state, row);
    }
  }

  /**
   * Gets the token boxes that are visible in the cell
   * @param column The visible column
   * @param row The visible row
   * @param state The GridRenderState
   * @returns An array of TokenBox of visible tokens or empty array with coordinates relative to gridX and gridY
   */
  getTokenBoxesForVisibleCell(
    column: VisibleIndex,
    row: VisibleIndex,
    state: GridRenderState
  ): TokenBox[] {
    const { metrics, context, model, theme } = state;

    if (context == null || metrics == null) {
      return (EMPTY_ARRAY as unknown) as TokenBox[];
    }

    const { modelRows, modelColumns } = metrics;
    const modelRow = getOrThrow(modelRows, row);
    const modelColumn = getOrThrow(modelColumns, column);

    const text = model.textForCell(modelColumn, modelRow);
    const {
      width: textWidth,
      x: textX,
      y: textY,
    } = GridUtils.getTextRenderMetrics(state, column, row);

    const { fontWidths } = metrics;

    // Set the font and baseline and change it back after
    context.save();
    this.configureContext(context, state);

    const fontWidth =
      fontWidths?.get(context.font) ?? GridRenderer.DEFAULT_FONT_WIDTH;
    const truncationChar = model.truncationCharForCell(modelColumn, modelRow);
    const truncatedText = this.getCachedTruncatedString(
      context,
      text,
      textWidth,
      fontWidth,
      truncationChar
    );

    const {
      actualBoundingBoxAscent,
      actualBoundingBoxDescent,
    } = context.measureText(truncatedText);
    const textHeight = actualBoundingBoxAscent + actualBoundingBoxDescent;

    const tokens = model.tokensForCell(
      modelColumn,
      modelRow,
      truncatedText.length
    );

    // Check if the truncated text contains a link
    if (tokens.length === 0) {
      context.restore();
      return (EMPTY_ARRAY as unknown) as TokenBox[];
    }

    const cachedTokenBoxes = this.getCachedTokenBoxesForVisibleCell(
      truncatedText,
      tokens,
      theme.font,
      'middle',
      textHeight,
      context
    ).map(tokenBox => ({
      x1: tokenBox.x1 + textX,
      y1: tokenBox.y1 + (textY - actualBoundingBoxAscent),
      x2: tokenBox.x2 + textX,
      y2: tokenBox.y2 + (textY - actualBoundingBoxAscent),
      token: tokenBox.token,
    }));

    context.restore();

    return cachedTokenBoxes;
  }

  configureContext(
    context: CanvasRenderingContext2D,
    state: GridRenderState
  ): void {
    const { theme } = state;
    context.font = theme.font;
    context.textBaseline = 'middle';
    context.lineCap = 'butt';
  }

  getCachedTruncatedString = memoizeClear(
    (
      context: CanvasRenderingContext2D,
      text: string,
      width: number,
      fontWidth: number,
      truncationChar?: string
    ): string =>
      GridRenderer.truncateToWidth(
        context,
        text,
        width,
        fontWidth,
        truncationChar
      ),
    { max: 10000 }
  );

  /**
   * Returns an array of token boxes with the coordinates relative to the top left corner of the text
   */
  getCachedTokenBoxesForVisibleCell = memoizeClear(
    (
      truncatedText: string,
      tokens: Token[],
      // _font and _baseline are passed in so value is re-calculated when they change
      // They should already be set on the `context`, so they are not used in this method
      _font: string,
      _baseline: CanvasTextBaseline,
      textHeight: number,
      context: CanvasRenderingContext2D
    ): TokenBox[] => {
      const top = 0;
      const bottom = textHeight;

      const tokenBoxes: TokenBox[] = [];

      // The index where the last token ended
      let lastTokenEnd = 0;
      // The width of the text preceding the current token
      let currentTextWidth = 0;
      // Loop through array and push them to array
      for (let i = 0; i < tokens.length; i += 1) {
        const token = tokens[i];
        const { start, end } = token;
        // The last token value is calculated based on the full text so the value needs to be truncated
        const value =
          end > truncatedText.length
            ? truncatedText.substring(start)
            : token.value;

        // Add the width of the text in between this token and the last token
        currentTextWidth += context.measureText(
          truncatedText.substring(lastTokenEnd, start)
        ).width;
        const tokenWidth = context.measureText(value).width;

        // Check if the x position is less than the grid x, then tokenWidth should be shifted by gridX - startX

        const left = currentTextWidth;
        const right = left + tokenWidth;

        const newTokenBox: TokenBox = {
          x1: left,
          y1: top,
          x2: right,
          y2: bottom,
          token,
        };

        tokenBoxes.push(newTokenBox);

        lastTokenEnd = end;
        currentTextWidth += tokenWidth;
      }

      return tokenBoxes;
    },
    { max: 10000 }
  );
}

export default TextCellRenderer;
