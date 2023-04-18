/* eslint-disable class-methods-use-this */
import { getOrThrow } from '@deephaven/utils';
import CellRenderer from './CellRenderer';
import { isExpandableGridModel } from './ExpandableGridModel';
import { isDataBarGridModel } from './DataBarGridModel';
import { VisibleIndex } from './GridMetrics';
import { GridRenderState } from './GridRenderer';
import GridColorUtils, { Oklab } from './GridColorUtils';
import GridUtils from './GridUtils';
import memoizeClear from './memoizeClear';

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
  drawCellContent(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex
  ) {
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
    } = metrics;

    const isFirstColumn = column === firstColumn;
    const rowHeight = getOrThrow(allRowHeights, row);
    const modelRow = getOrThrow(modelRows, row);
    const modelColumn = getOrThrow(modelColumns, column);
    const rowY = getOrThrow(allRowYs, row);
    const textAlign = model.textAlignForCell(modelColumn, modelRow);
    const text = model.textForCell(modelColumn, modelRow);
    const value = Number(text);
    const { x: textX, y: textY } = GridUtils.getTextRenderMetrics(
      state,
      column,
      row
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
    } = model.dataBarOptionsForCell(modelColumn, modelRow);

    const hasGradient = Array.isArray(dataBarColor);
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
      context.fillStyle = dataBarColor;
    }
    context.textBaseline = 'middle';
    context.font = theme.font;

    if (valuePlacement !== 'hide') {
      context.fillText(text, textX, textY);
    }

    // Draw bar
    if (hasGradient) {
      // Draw gradient bar

      const dataBarColorsOklab: Oklab[] = dataBarColor.map(color =>
        GridColorUtils.linearSRGBToOklab(GridColorUtils.hexToRgb(color))
      );

      context.save();

      context.beginPath();

      context.roundRect(dataBarX, dataBarY, dataBarWidth, rowHeight - 2, 1);
      context.clip();

      if (value < 0) {
        if (direction === 'LTR') {
          const totalGradientWidth = Math.round(
            (Math.abs(columnMin) / totalValueRange) * maxWidth
          );
          const partGradientWidth =
            totalGradientWidth / (dataBarColor.length - 1);
          let gradientX = Math.round(leftmostPosition);
          for (let i = 0; i < dataBarColor.length - 1; i += 1) {
            const leftColor = dataBarColorsOklab[i];
            const rightColor = dataBarColorsOklab[i + 1];
            this.drawGradient(
              context,
              leftColor,
              rightColor,
              gradientX,
              rowY + 1,
              partGradientWidth,
              rowHeight - 2
            );

            gradientX += partGradientWidth;
          }
        } else if (direction === 'RTL') {
          const totalGradientWidth = Math.round(
            maxWidth - (Math.abs(columnMax) / totalValueRange) * maxWidth
          );
          const partGradientWidth =
            totalGradientWidth / (dataBarColor.length - 1);
          let gradientX = Math.round(zeroPosition);
          for (let i = dataBarColor.length - 1; i > 0; i -= 1) {
            const leftColor = dataBarColorsOklab[i];
            const rightColor = dataBarColorsOklab[i - 1];
            this.drawGradient(
              context,
              leftColor,
              rightColor,
              gradientX,
              rowY + 1,
              partGradientWidth,
              rowHeight - 2
            );

            gradientX += partGradientWidth;
          }
        }
      } else if (direction === 'LTR') {
        // Value is greater than or equal to 0
        const totalGradientWidth =
          Math.round(
            maxWidth - (Math.abs(columnMin) / totalValueRange) * maxWidth
          ) - 1;
        const partGradientWidth =
          totalGradientWidth / (dataBarColor.length - 1);
        let gradientX = Math.round(zeroPosition);

        for (let i = 0; i < dataBarColor.length - 1; i += 1) {
          const leftColor = dataBarColorsOklab[i];
          const rightColor = dataBarColorsOklab[i + 1];
          this.drawGradient(
            context,
            leftColor,
            rightColor,
            gradientX,
            rowY + 1,
            partGradientWidth,
            rowHeight - 2
          );

          gradientX += partGradientWidth;
        }
      } else if (direction === 'RTL') {
        // Value is greater than or equal to 0
        const totalGradientWidth = Math.round(
          (Math.abs(columnMax) / totalValueRange) * maxWidth
        );
        const partGradientWidth =
          totalGradientWidth / (dataBarColor.length - 1);
        let gradientX = Math.round(leftmostPosition);

        for (let i = dataBarColor.length - 1; i > 0; i -= 1) {
          const leftColor = dataBarColorsOklab[i];
          const rightColor = dataBarColorsOklab[i - 1];
          this.drawGradient(
            context,
            leftColor,
            rightColor,
            gradientX,
            rowY + 1,
            partGradientWidth,
            rowHeight - 2
          );

          gradientX += partGradientWidth;
        }
      }

      // restore clip
      context.restore();
    } else {
      // Draw normal bar
      context.save();

      context.globalAlpha = opacity;
      context.beginPath();
      context.roundRect(dataBarX, dataBarY, dataBarWidth, rowHeight - 2, 1);
      context.fill();

      context.restore();
    }

    // Draw markers
    markerXs.forEach((markerX, index) => {
      context.fillStyle = markers[index].color;
      context.fillRect(markerX, dataBarY, 1, rowHeight - 2);
    });

    // Draw dashed line
    if (axis !== 'directional' || valuePlacement === 'beside') {
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
    } = metrics;
    const {
      cellHorizontalPadding,
      treeDepthIndent,
      treeHorizontalPadding,
    } = theme;

    const modelColumn = getOrThrow(modelColumns, column);
    const modelRow = getOrThrow(modelRows, row);
    const x = getOrThrow(allColumnXs, column);
    const y = getOrThrow(allRowYs, row);
    const columnWidth = getOrThrow(allColumnWidths, column);
    const isFirstColumn = column === firstColumn;
    const text = model.textForCell(modelColumn, modelRow);
    const value = Number(text);
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
    } = model.dataBarOptionsForCell(modelColumn, modelRow);
    const longestValueWidth = this.getCachedWidestValueForColumn(
      context,
      state,
      column
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

    const columnLongest = Math.max(Math.abs(columnMin), Math.abs(columnMax));
    // If axis is proportional, totalValueRange is proportional to maxWidth
    let dataBarWidth = (Math.abs(value) / totalValueRange) * maxWidth;

    if (axis === 'middle') {
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
      const { column: markerColumn } = marker;
      const markerValue = Number(model.textForCell(markerColumn, modelRow));
      return markerValue >= 0
        ? zeroPosition + (Math.abs(markerValue) / totalValueRange) * maxWidth
        : zeroPosition - (Math.abs(markerValue) / totalValueRange) * maxWidth;
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
        const { column: markerColumn } = marker;
        const markerValue = Number(model.textForCell(markerColumn, modelRow));
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
          const { column: markerColumn } = marker;
          const markerValue = Number(model.textForCell(markerColumn, modelRow));
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
          const { column: markerColumn } = marker;
          const markerValue = Number(model.textForCell(markerColumn, modelRow));
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
          const { column: markerColumn } = marker;
          const markerValue = Number(model.textForCell(markerColumn, modelRow));
          return (
            zeroPosition + (Math.abs(markerValue) / columnLongest) * maxWidth
          );
        });
      } else if (direction === 'RTL') {
        // Directional, RTL
        zeroPosition = columnWidth;
        dataBarX = zeroPosition - (Math.abs(value) / columnLongest) * maxWidth;
        markerXs = markers.map(marker => {
          const { column: markerColumn } = marker;
          const markerValue = Number(model.textForCell(markerColumn, modelRow));
          return (
            zeroPosition - (Math.abs(markerValue) / columnLongest) * maxWidth
          );
        });
      }
    }

    // Offset all values by the actual x value and padding
    if (direction === 'LTR') {
      zeroPosition += x + leftPadding;
      dataBarX += x + leftPadding;
      markerXs = markerXs.map(markerX => markerX + x + leftPadding);

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

    leftmostPosition += x;
    rightmostPosition += x;

    return {
      maxWidth,
      x: dataBarX,
      y: y + 1,
      zeroPosition,
      leftmostPosition,
      rightmostPosition,
      totalValueRange,
      dataBarWidth,
      markerXs,
    };
  }

  drawGradient(
    context: CanvasRenderingContext2D,
    leftColor: Oklab,
    rightColor: Oklab,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    let currentColor = leftColor;
    // Increase by 0.5 because half-pixel will render weird on different zooms
    for (let currentX = x; currentX <= x + width; currentX += 0.5) {
      this.drawGradientPart(
        context,
        currentX,
        y,
        1,
        height,
        GridColorUtils.rgbToHex(GridColorUtils.OklabToLinearSRGB(currentColor))
      );

      currentColor = GridColorUtils.lerpColor(
        leftColor,
        rightColor,
        (currentX - x) / width
      );
    }
  }

  drawGradientPart(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  }

  /**
   * Returns the width of the widest value in pixels
   */
  getCachedWidestValueForColumn = memoizeClear(
    (
      context: CanvasRenderingContext2D,
      state: GridRenderState,
      column: VisibleIndex
    ): number => {
      const { metrics, model } = state;
      const { visibleRows, modelColumns, modelRows } = metrics;
      const modelColumn = getOrThrow(modelColumns, column);
      let widestValue = 0;
      for (let i = 0; i < visibleRows.length; i += 1) {
        const row = visibleRows[i];
        const modelRow = getOrThrow(modelRows, row);
        const value = Number(model.textForCell(modelColumn, modelRow));
        widestValue = Math.max(
          widestValue,
          context.measureText(`${value}`).width
        );
      }

      return widestValue;
    }
  );
}

export default DataBarCellRenderer;
