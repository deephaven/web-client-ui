/* eslint-disable class-methods-use-this */
import { getOrThrow } from '@deephaven/utils';
import clamp from 'lodash.clamp';
import CellRenderer from './CellRenderer';
import { isExpandableGridModel } from './ExpandableGridModel';
import { isDataBarGridModel } from './MockDataBarGridModel';
import GridTheme from './GridTheme';
import { VisibleIndex } from './GridMetrics';
import { GridRenderState } from './GridRenderer';

type RGB = { r: number; g: number; b: number };
type Oklab = { L: number; a: number; b: number };

/**
 * Converts a color in RGB to Oklab
 * @param color An RGB color
 * @returns The color but respresented as an Oklab color
 */
const linearSRGBToOklab = (color: RGB): Oklab => {
  const { r, g, b } = color;

  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l2 = Math.cbrt(l);
  const m2 = Math.cbrt(m);
  const s2 = Math.cbrt(s);

  return {
    L: 0.2104542553 * l2 + 0.793617785 * m2 - 0.0040720468 * s2,
    a: 1.9779984951 * l2 - 2.428592205 * m2 + 0.4505937099 * s2,
    b: 0.0259040371 * l2 + 0.7827717662 * m2 - 0.808675766 * s2,
  };
};

/**
 * Converts an Oklab color to RGB
 * @param color An Oklab color
 * @returns The given color but represented as a RGB color
 */
const OklabToLinearSRGB = (color: Oklab): RGB => {
  const { L, a, b } = color;

  const l2 = L + 0.3963377774 * a + 0.2158037573 * b;
  const m2 = L - 0.1055613458 * a - 0.0638541728 * b;
  const s2 = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l2 * l2 * l2;
  const m = m2 * m2 * m2;
  const s = s2 * s2 * s2;

  return {
    r: clamp(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, 0, 255),
    g: clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, 0, 255),
    b: clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s, 0, 255),
  };
};

/**
 * Converts a hex color to RGB
 * @param hex A hex color
 * @returns The RGB representation of the given color
 */
const hexToRgb = (hex: string): RGB => {
  const rgbArray = hex
    .replace(
      /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
      (m: string, r: string, g: string, b: string) =>
        `#${r}${r}${g}${g}${b}${b}`
    )
    .substring(1)
    .match(/.{2}/g)
    ?.map((x: string) => parseInt(x, 16)) ?? [0, 0, 0];

  return { r: rgbArray[0], g: rgbArray[1], b: rgbArray[2] };
};

/**
 * Converts a RGB color to hex
 * @param color A RGB color
 * @returns The hexcode of the given color
 */
const rgbToHex = (color: RGB): string => {
  const r = Math.round(color.r);
  const g = Math.round(color.g);
  const b = Math.round(color.b);

  return `#${[r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    })
    .join('')}`;
};

/**
 * Calculates a color given an interpolation factor between two given colors
 * @param color1 Color on one end
 * @param color2 Color on other end
 * @param factor The interpolation factor (0 to 1, 0 will be color1 while 1 will be color2)
 * @returns The color determined by the interpolation factor between the two colors
 */
const lerpColor = (color1: Oklab, color2: Oklab, factor: number): Oklab => {
  const { L: L1, a: a1, b: b1 } = color1;
  const { L: L2, a: a2, b: b2 } = color2;

  const L = L1 + (L2 - L1) * factor;
  const a = a1 + (a2 - a1) * factor;
  const b = b1 + (b2 - b1) * factor;

  return { L, a, b };
};

class DataBarCellRenderer extends CellRenderer {
  drawCellContent(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex,
    textOverride?: string
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
    const text = textOverride ?? model.textForCell(modelColumn, modelRow);
    const value = Number(text);
    const { x: textX, y: textY } = this.getTextRenderMetrics(
      state,
      column,
      row
    );
    const columnMin = model.minOfColumn(modelColumn);
    const columnMax = model.maxOfColumn(modelColumn);
    const axis = model.axisForCell(modelColumn, modelRow);
    const dataBarColor = model.barColorForCell(modelColumn, modelRow);
    const valuePlacement = model.valuePlacementForCell(modelColumn, modelRow);
    const opacity = model.opacityForCell(modelColumn, modelRow);
    const markers = model.markersForColumn(modelColumn);
    const hasGradient = model.hasGradientForCell(modelColumn, modelRow);
    if (columnMin == null || columnMax == null) {
      return;
    }

    const {
      width: maxWidth,
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
    context.fillStyle = dataBarColor;
    context.textBaseline = 'middle';
    context.font = theme.font;

    if (valuePlacement !== 'hide') {
      context.fillText(text, textX, textY);
    }

    // Draw bar
    if (hasGradient) {
      // Draw gradient bar

      const positiveColor = model.positiveColorForCell(modelColumn, modelRow);
      const negativeColor = model.negativeColorForCell(modelColumn, modelRow);
      const positiveColorOklab = linearSRGBToOklab(hexToRgb(positiveColor));
      const negativeColorOklab = linearSRGBToOklab(hexToRgb(negativeColor));
      const middleColor: Oklab = lerpColor(
        negativeColorOklab,
        positiveColorOklab,
        0.5
      );

      context.save();

      context.beginPath();

      context.roundRect(dataBarX, dataBarY, dataBarWidth, rowHeight - 2, 1);
      context.clip();

      if (value < 0) {
        this.drawGradient(
          context,
          negativeColorOklab,
          middleColor,
          Math.round(leftmostPosition),
          rowY + 1,
          Math.round((Math.abs(columnMin) / totalValueRange) * maxWidth),
          rowHeight - 2
        );
      } else {
        this.drawGradient(
          context,
          middleColor,
          positiveColorOklab,
          Math.round(zeroPosition),
          rowY + 1,
          Math.round(
            maxWidth - (Math.abs(columnMin) / totalValueRange) * maxWidth
          ) - 1,
          rowHeight - 2
        );
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
      context.strokeStyle = GridTheme.zeroLineColor;
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

  getTextRenderMetrics(
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex
  ): {
    width: number;
    x: number;
    y: number;
  } {
    const { metrics, model, theme } = state;
    const {
      firstColumn,
      allColumnXs,
      allColumnWidths,
      allRowYs,
      allRowHeights,
      modelRows,
      modelColumns,
    } = metrics;
    const {
      cellHorizontalPadding,
      treeDepthIndent,
      treeHorizontalPadding,
    } = theme;

    const modelRow = getOrThrow(modelRows, row);
    const modelColumn = getOrThrow(modelColumns, column);
    const textAlign = model.textAlignForCell(modelColumn, modelRow);
    const x = getOrThrow(allColumnXs, column);
    const y = getOrThrow(allRowYs, row);
    const columnWidth = getOrThrow(allColumnWidths, column);
    const rowHeight = getOrThrow(allRowHeights, row);
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
    const textWidth = columnWidth - treeIndent;
    let textX = x + cellHorizontalPadding;
    const textY = y + rowHeight * 0.5;
    if (textAlign === 'right') {
      textX = x + textWidth - cellHorizontalPadding;
    } else if (textAlign === 'center') {
      textX = x + textWidth * 0.5;
    }
    textX += treeIndent;

    return {
      width: textWidth - cellHorizontalPadding * 2,
      x: textX,
      y: textY,
    };
  }

  getDataBarRenderMetrics(
    context: CanvasRenderingContext2D,
    state: GridRenderState,
    column: VisibleIndex,
    row: VisibleIndex
  ): {
    width: number;
    x: number;
    y: number;
    zeroPosition: number;
    leftmostPosition: number;
    rightmostPosition: number;
    totalValueRange: number;
    dataBarWidth: number;
    markerXs: number[];
  } {
    const { metrics, model, theme } = state;
    if (!isDataBarGridModel(model)) {
      return {
        width: 0,
        x: 0,
        y: 0,
        markerXs: [],
        zeroPosition: 0,
        leftmostPosition: 0,
        rightmostPosition: 0,
        totalValueRange: 0,
        dataBarWidth: 0,
      };
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
    const columnMin = model.minOfColumn(modelColumn);
    const columnMax = model.maxOfColumn(modelColumn);
    const axis = model.axisForCell(modelColumn, modelRow);
    const valuePlacement = model.valuePlacementForCell(modelColumn, modelRow);
    const direction = model.directionForCell(modelColumn, modelRow);
    const markers = model.markersForColumn(modelColumn);
    const longestValueWidth = Math.max(
      context.measureText(`${columnMin}`).width,
      context.measureText(`${columnMax}`).width
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
      width: maxWidth,
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
    // Increase by 0.5 because half-pizel will render weird on different zooms
    for (let currentX = x; currentX <= x + width; currentX += 0.5) {
      this.drawGradientPart(
        context,
        currentX,
        y,
        1,
        height,
        rgbToHex(OklabToLinearSRGB(currentColor))
      );

      currentColor = lerpColor(leftColor, rightColor, (currentX - x) / width);
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
}

export default DataBarCellRenderer;
