/* eslint class-methods-use-this: "off" */
import {
  GridPoint,
  GridMetrics,
  GridMouseHandler,
  VisibleIndex,
} from '@deephaven/grid';
import deepEqual from 'deep-equal';
import { TableUtils } from '..';
import type IrisGrid from '../IrisGrid';
import IrisGridRenderer from '../IrisGridRenderer';

/**
 * Detects if the hovered cell is truncated and sets state on IrisGrid to display a view overflow button
 */
class IrisGridCellOverflowMouseHandler extends GridMouseHandler {
  private irisGrid: IrisGrid;

  private buttonProps: {
    top: number;
    right: number;
    column: VisibleIndex;
    row: VisibleIndex;
  } | null;

  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
    this.buttonProps = null;
  }

  destroyButton(): void {
    if (this.buttonProps != null) {
      this.buttonProps = null;
      this.irisGrid.setState({ overflowProps: null });
    }
  }

  onContextMenu(): boolean {
    this.destroyButton();
    return false;
  }

  onWheel(): boolean {
    this.destroyButton();
    return false;
  }

  onLeave(): boolean {
    this.destroyButton();
    return false;
  }

  onMove(cell: GridPoint): boolean {
    const { column, row } = cell;
    const { model } = this.irisGrid.props;
    const { metrics } = (this.irisGrid.state as unknown) as {
      metrics: GridMetrics;
    };
    const { renderer, grid } = this.irisGrid;
    const { canvasContext: context } = grid ?? {};
    const theme = this.irisGrid.getTheme();

    if (
      grid == null ||
      metrics == null ||
      column == null ||
      row == null ||
      context == null
    ) {
      this.destroyButton();
      return false;
    }

    const {
      visibleColumnXs,
      visibleRowYs,
      visibleColumnWidths,
      modelColumns,
      modelRows,
      verticalBarWidth,
      width,
    } = metrics;

    const modelColumn = modelColumns.get(column);
    const modelRow = modelRows.get(row);
    const left = visibleColumnXs.get(column);
    const top = visibleRowYs.get(row);
    const columnWidth = visibleColumnWidths.get(column);

    if (
      modelColumn == null ||
      modelRow == null ||
      columnWidth == null ||
      left == null ||
      top == null ||
      !TableUtils.isStringType(model.columns[modelColumn].type)
    ) {
      this.destroyButton();
      return false;
    }

    const text = model.textForCell(modelColumn, modelRow);

    if (text == null) {
      return false;
    }

    context.save();
    context.font = theme.font;
    const textWidth = columnWidth - 2 * theme.cellHorizontalPadding;
    const fontWidth =
      metrics.fontWidths.get(context.font) ??
      IrisGridRenderer.DEFAULT_FONT_WIDTH;

    const truncatedText = renderer.getCachedTruncatedString(
      context,
      text,
      textWidth,
      fontWidth
    );
    context.restore();

    if (truncatedText === text) {
      this.destroyButton();
      return false;
    }

    const buttonRight = Math.max(
      verticalBarWidth, // Right edge of the contianer
      width - (metrics.gridX + left + columnWidth) // Right edge of the column
    );
    const buttonTop = metrics.gridY + top;

    const buttonProps = {
      right: buttonRight,
      top: buttonTop,
      column,
      row,
    };

    if (deepEqual(buttonProps, this.buttonProps)) {
      return false;
    }

    this.buttonProps = buttonProps;

    this.irisGrid.setState({
      overflowProps: this.buttonProps,
    });

    return false;
  }
}

export default IrisGridCellOverflowMouseHandler;
