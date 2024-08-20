/* eslint-disable class-methods-use-this */
import { getOrThrow } from '@deephaven/utils';
import CellRenderer from './CellRenderer';
import { isExpandableGridModel } from './ExpandableGridModel';
import { isDataBarGridModel } from './DataBarGridModel';
import { ModelIndex, VisibleIndex, VisibleToModelMap } from './GridMetrics';
import GridColorUtils from './GridColorUtils';
import GridUtils from './GridUtils';
import memoizeClear from './memoizeClear';
import { DEFAULT_FONT_WIDTH, GridRenderState } from './GridRendererTypes';
import GridModel from './GridModel';

interface DataBarRenderMetrics {
  /** The total width the entire bar from the min to max value can take up (rightmostPosition - leftmostPosition) */
  maxWidth: number;
  /** The x coordinate of the bar (the left) */
  x: number;
  /** The y coordinate of the bar (the top) */
  y: number;
  /** The position of the zero line */
  zeroPosition: number;
  /** The position of the leftmost point */
  leftmostPosition: number;
  /** The position of the rightmost point */
  rightmostPosition: number;
  /** The range of values (e.g. max of 100 and min of -50 means range of 150) */
  totalValueRange: number;
  /** The width of the databar */
  dataBarWidth: number;
  /** The x coordinates of the markers (the left) */
  markerXs: number[];
}
class DataBarCellRenderer extends CellRenderer {
  static getGradient = memoizeClear(
    (width: number, colors: string[]): CanvasGradient => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx == null) {
        throw new Error('Failed to create canvas context');
      }
      if (Number.isNaN(width)) {
        return ctx.createLinearGradient(0, 0, 0, 0);
      }
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      const oklabColors = colors.map(color =>
        GridColorUtils.linearSRGBToOklab(GridColorUtils.hexToRgb(color))
      );
      for (let i = 0; i < width; i += 1) {
        const colorStop = i / width;
        const colorChangeInterval = 1 / (colors.length - 1);
        const leftColorIndex = Math.floor(colorStop / colorChangeInterval);
        const color = GridColorUtils.lerpColor(
          oklabColors[leftColorIndex],
          oklabColors[leftColorIndex + 1],
          (colorStop % colorChangeInterval) / colorChangeInterval
        );
        gradient.addColorStop(
          i / width,
          GridColorUtils.rgbToHex(GridColorUtils.OklabToLinearSRGB(color))
        );
      }
      return gradient;
    },
    {
      max: 1000,
      primitive: true, // Stringify the arguments for memoization. Lets the color arrays be different arrays in memory, but still cache hit
    }
  );

  drawCellContent(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex
  ): void {
    const { metrics, model, theme } = state;
    if (!isDataBarGridModel(model)) {
      return;
    }
    const {
      modelColumns,
      modelRows,
      allRowHeights,
      allRowYs,
      firstColumn,
      fontWidths,
    } = metrics;

    const isFirstColumn = column === firstColumn;
    const rowHeight = getOrThrow(allRowHeights, row);
    const modelRow = getOrThrow(modelRows, row);
    const modelColumn = getOrThrow(modelColumns, column);
    const rowY = getOrThrow(allRowYs, row);
    const textAlign = model.textAlignForCell(modelColumn, modelRow);
    const text = model.textForCell(modelColumn, modelRow);
    const { x: textX, width: textWidth } = GridUtils.getTextRenderMetrics(
      state,
      column,
      row
    );

    const fontWidth = fontWidths?.get(context.font) ?? DEFAULT_FONT_WIDTH;
    const truncationChar = model.truncationCharForCell(modelColumn, modelRow);
    const truncatedText = this.getCachedTruncatedString(
      context,
      text,
      textWidth,
      fontWidth,
      truncationChar
    );

    const {
      columnMin,
      columnMax,
      axis,
      color: dataBarColor,
      valuePlacement,
      opacity,
      markers,
      direction,
      value,
    } = model.dataBarOptionsForCell(modelColumn, modelRow, theme);

    const hasGradient = Array.isArray(dataBarColor) && dataBarColor.length > 1;
    if (columnMin == null || columnMax == null) {
      return;
    }

    const {
      maxWidth,
      x: dataBarX,
      y: dataBarY,
      zeroPosition,
      leftmostPosition,
      markerXs,
      totalValueRange,
      dataBarWidth,
    } = this.getDataBarRenderMetrics(context, state, column, row);

    context.save();
    context.textAlign = textAlign;
    if (hasGradient) {
      const color =
        value >= 0 ? dataBarColor[dataBarColor.length - 1] : dataBarColor[0];
      context.fillStyle = color;
    } else {
      context.fillStyle = Array.isArray(dataBarColor)
        ? dataBarColor[0]
        : dataBarColor;
    }
    context.textBaseline = 'middle';
    context.font = theme.font;

    if (valuePlacement !== 'hide') {
      context.fillText(truncatedText, textX, rowY + rowHeight * 0.5);
    }

    context.save();
    context.beginPath();
    context.roundRect(dataBarX, rowY + 1, dataBarWidth, rowHeight - 2, 1);
    context.clip();
    context.globalAlpha = opacity;

    // Draw bar
    if (hasGradient) {
      // Draw gradient bar

      let gradientWidth = 0;
      let gradientX = 0;
      context.save();

      // Translate the context so its origin is at the start of the gradient
      // and increasing x value moves towards the end of the gradient.
      // For RTL, scale x by -1 to flip across the x-axis
      if (value < 0) {
        if (direction === 'LTR') {
          gradientWidth = Math.round(
            (Math.abs(columnMin) / totalValueRange) * maxWidth
          );
          gradientX = Math.round(leftmostPosition);
          context.translate(gradientX, 0);
        } else if (direction === 'RTL') {
          gradientWidth = Math.round(
            maxWidth - (Math.abs(columnMax) / totalValueRange) * maxWidth
          );
          gradientX = Math.round(zeroPosition);
          context.translate(gradientX + gradientWidth, 0);
          context.scale(-1, 1);
        }
      } else if (direction === 'LTR') {
        // Value is greater than or equal to 0
        gradientWidth =
          Math.round(
            maxWidth - (Math.abs(columnMin) / totalValueRange) * maxWidth
          ) - 1;
        gradientX = Math.round(zeroPosition);
        context.translate(gradientX, 0);
      } else if (direction === 'RTL') {
        // Value is greater than or equal to 0
        gradientWidth = Math.round(
          (Math.abs(columnMax) / totalValueRange) * maxWidth
        );
        gradientX = Math.round(leftmostPosition);
        context.translate(gradientX + gradientWidth, 0);
        context.scale(-1, 1);
      }

      const gradient = DataBarCellRenderer.getGradient(
        gradientWidth,
        dataBarColor
      );
      context.fillStyle = gradient;
      context.fillRect(0, dataBarY, gradientWidth, rowHeight);
      context.restore(); // Restore gradient translate/scale
    } else {
      // Draw normal bar
      context.beginPath();
      context.roundRect(dataBarX, dataBarY, dataBarWidth, rowHeight, 1);
      context.fill();
    }

    // Draw markers
    if (maxWidth > 0) {
      markerXs.forEach((markerX, index) => {
        context.fillStyle = markers[index].color;
        context.fillRect(markerX, dataBarY, 1, rowHeight);
      });
    }

    // restore clip
    context.restore();

    const shouldRenderDashedLine = !(
      axis === 'directional' &&
      ((valuePlacement === 'beside' &&
        textAlign === 'right' &&
        direction === 'LTR') ||
        (valuePlacement === 'beside' &&
          textAlign === 'left' &&
          direction === 'RTL') ||
        valuePlacement !== 'beside')
    );

    // Draw dashed line
    if (shouldRenderDashedLine) {
      context.strokeStyle = theme.zeroLineColor;
      context.beginPath();
      context.setLineDash([2, 1]);
      context.moveTo(zeroPosition, rowY);
      context.lineTo(zeroPosition, rowY + rowHeight);
      context.stroke();
    }

    context.restore();

    // Draw tree marker
    if (
      isFirstColumn &&
      isExpandableGridModel(model) &&
      model.hasExpandableRows
    ) {
      this.drawCellRowTreeMarker(context, state, row);
    }
  }

  getDataBarRenderMetrics(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex
  ): DataBarRenderMetrics {
    const { metrics, model, theme } = state;
    if (!isDataBarGridModel(model)) {
      throw new Error('Grid model is not a data bar grid model');
    }
    const {
      firstColumn,
      allColumnXs,
      allColumnWidths,
      allRowYs,
      modelColumns,
      modelRows,
      visibleRows,
    } = metrics;
    const { cellHorizontalPadding, treeDepthIndent, treeHorizontalPadding } =
      theme;

    const modelColumn = getOrThrow(modelColumns, column);
    const modelRow = getOrThrow(modelRows, row);
    const x = getOrThrow(allColumnXs, column);
    const y = getOrThrow(allRowYs, row);
    const columnWidth = getOrThrow(allColumnWidths, column);
    const isFirstColumn = column === firstColumn;
    let treeIndent = 0;
    if (
      isExpandableGridModel(model) &&
      model.hasExpandableRows &&
      isFirstColumn
    ) {
      treeIndent =
        treeDepthIndent * (model.depthForRow(row) + 1) + treeHorizontalPadding;
    }

    const textAlign = model.textAlignForCell(modelColumn, modelRow);
    const {
      columnMin,
      columnMax,
      axis,
      valuePlacement,
      markers,
      direction,
      value,
    } = model.dataBarOptionsForCell(modelColumn, modelRow, theme);
    const longestValueWidth = this.getCachedWidestValueForColumn(
      context,
      visibleRows,
      modelRows,
      model,
      modelColumn
    );

    const leftPadding = 2;
    const rightPadding =
      valuePlacement === 'beside' && textAlign === 'right' ? 2 : 1;

    // The value of the total range (e.g. max - column)
    let totalValueRange = columnMax - columnMin;
    // If min and max are both positive or min and max are equal, the max length is columnMax
    if ((columnMax >= 0 && columnMin >= 0) || columnMin === columnMax) {
      totalValueRange = columnMax;
    } else if (columnMax <= 0 && columnMin <= 0) {
      // If min and max are both negative, the max length is the absolute value of columnMin
      totalValueRange = Math.abs(columnMin);
    }

    let maxWidth = columnWidth - treeIndent - rightPadding - leftPadding;
    if (valuePlacement === 'beside') {
      maxWidth = maxWidth - cellHorizontalPadding - longestValueWidth;
    }

    if (maxWidth < 0) {
      maxWidth = 0;
    }

    const columnLongest = Math.max(Math.abs(columnMin), Math.abs(columnMax));
    // If axis is proportional, totalValueRange is proportional to maxWidth
    let dataBarWidth = (Math.abs(value) / totalValueRange) * maxWidth;

    if (maxWidth === 0) {
      dataBarWidth = 0;
    } else if (axis === 'middle') {
      // The longest bar is proportional to half of the maxWidth
      dataBarWidth = (Math.abs(value) / columnLongest) * (maxWidth / 2);
    } else if (axis === 'directional') {
      // The longest bar is proportional to the maxWidth
      dataBarWidth = (Math.abs(value) / columnLongest) * maxWidth;
    }

    // Default: proportional, beside, LTR, right text align
    // All positions are assuming the left side is 0 and the right side is maxWidth
    let zeroPosition =
      columnMin >= 0 ? 0 : (Math.abs(columnMin) / totalValueRange) * maxWidth;
    let dataBarX =
      value >= 0
        ? zeroPosition
        : zeroPosition - (Math.abs(value) / totalValueRange) * maxWidth;
    let markerXs = markers.map(marker => {
      const { value: markerValue } = marker;
      const offset = (Math.abs(markerValue) / totalValueRange) * maxWidth;
      return markerValue >= 0 ? zeroPosition + offset : zeroPosition - offset;
    });
    let leftmostPosition =
      valuePlacement === 'beside' && textAlign === 'left'
        ? cellHorizontalPadding + longestValueWidth + leftPadding
        : leftPadding;
    let rightmostPosition =
      valuePlacement === 'beside' && textAlign === 'right'
        ? columnWidth - cellHorizontalPadding - longestValueWidth - rightPadding
        : rightPadding;

    // Proportional, RTL
    if (direction === 'RTL') {
      zeroPosition =
        columnMin >= 0
          ? columnWidth
          : columnWidth - (Math.abs(columnMin) / totalValueRange) * maxWidth;
      dataBarX =
        value >= 0
          ? zeroPosition - (value / totalValueRange) * maxWidth
          : zeroPosition;
      markerXs = markers.map(marker => {
        const { value: markerValue } = marker;
        return markerValue >= 0
          ? zeroPosition - (Math.abs(markerValue) / totalValueRange) * maxWidth
          : zeroPosition + (Math.abs(markerValue) / totalValueRange) * maxWidth;
      });
    }

    if (axis === 'middle') {
      zeroPosition = maxWidth / 2;
      if (direction === 'LTR') {
        // Middle, LTR
        dataBarX =
          value >= 0
            ? zeroPosition
            : zeroPosition - (Math.abs(value) / columnLongest) * (maxWidth / 2);
        markerXs = markers.map(marker => {
          const { value: markerValue } = marker;

          return markerValue >= 0
            ? zeroPosition +
                (Math.abs(markerValue) / columnLongest) * (maxWidth / 2)
            : zeroPosition -
                (Math.abs(markerValue) / columnLongest) * (maxWidth / 2);
        });
      } else if (direction === 'RTL') {
        // Middle, RTL
        dataBarX =
          value <= 0
            ? zeroPosition
            : zeroPosition - (Math.abs(value) / columnLongest) * (maxWidth / 2);
        markerXs = markers.map(marker => {
          const { value: markerValue } = marker;

          return markerValue <= 0
            ? zeroPosition +
                (Math.abs(markerValue) / columnLongest) * (maxWidth / 2)
            : zeroPosition -
                (Math.abs(markerValue) / columnLongest) * (maxWidth / 2);
        });
      }
    } else if (axis === 'directional') {
      if (direction === 'LTR') {
        // Directional, LTR
        zeroPosition = 0;
        dataBarX = zeroPosition;
        markerXs = markers.map(marker => {
          const { value: markerValue } = marker;

          return (
            zeroPosition + (Math.abs(markerValue) / columnLongest) * maxWidth
          );
        });
      } else if (direction === 'RTL') {
        // Directional, RTL
        zeroPosition = columnWidth;
        dataBarX = zeroPosition - (Math.abs(value) / columnLongest) * maxWidth;
        markerXs = markers.map(marker => {
          const { value: markerValue } = marker;

          return (
            zeroPosition - (Math.abs(markerValue) / columnLongest) * maxWidth
          );
        });
      }
    }

    // Offset all values by the actual x value and padding
    if (direction === 'LTR') {
      zeroPosition += x + leftPadding + treeIndent;
      dataBarX += x + leftPadding + treeIndent;
      markerXs = markerXs.map(
        markerX => markerX + x + leftPadding + treeIndent
      );

      if (valuePlacement === 'beside' && textAlign === 'left') {
        zeroPosition += longestValueWidth + cellHorizontalPadding;
        dataBarX += longestValueWidth + cellHorizontalPadding;
        markerXs = markerXs.map(
          markerX => markerX + longestValueWidth + cellHorizontalPadding
        );
      }
    } else if (direction === 'RTL') {
      zeroPosition = zeroPosition + x - rightPadding;
      dataBarX = dataBarX + x - rightPadding;
      markerXs = markerXs.map(markerX => markerX + x - rightPadding);

      if (valuePlacement === 'beside' && textAlign === 'right') {
        zeroPosition = zeroPosition - cellHorizontalPadding - longestValueWidth;
        dataBarX = dataBarX - cellHorizontalPadding - longestValueWidth;
        markerXs = markerXs.map(
          markerX => markerX - cellHorizontalPadding - longestValueWidth
        );
      }
    }

    leftmostPosition += x + treeIndent;
    rightmostPosition += x;

    return {
      maxWidth,
      x: dataBarX,
      y,
      zeroPosition,
      leftmostPosition,
      rightmostPosition,
      totalValueRange,
      dataBarWidth,
      markerXs,
    };
  }

  getCachedWidth = memoizeClear(
    (context: CanvasRenderingContext2D, text: string): number =>
      context.measureText(text).width,
    { max: 10000 }
  );

  /**
   * Returns the width of the widest value in pixels
   */
  getCachedWidestValueForColumn = memoizeClear(
    (
      context: CanvasRenderingContext2D,
      visibleRows: readonly VisibleIndex[],
      modelRows: VisibleToModelMap,
      model: GridModel,
      column: ModelIndex
    ): number => {
      let widestValue = 0;
      for (let i = 0; i < visibleRows.length; i += 1) {
        const row = visibleRows[i];
        const modelRow = getOrThrow(modelRows, row);
        const text = model.textForCell(column, modelRow);
        widestValue = Math.max(widestValue, this.getCachedWidth(context, text));
      }

      return widestValue;
    },
    { max: 1000 }
  );
}

export default DataBarCellRenderer;
