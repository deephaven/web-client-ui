import Grid from '../Grid';
import GridUtils, { GridPoint } from '../GridUtils';
import GridMouseHandler, { GridMouseEvent } from '../GridMouseHandler';
import { getOrThrow } from '../GridMetricCalculator';
import { EventHandlerResult } from '../EventHandlerResult';
import type { VisibleIndex, ModelIndex, GridMetrics } from '../GridMetrics';
import type GridModel from '../GridModel';

const SLOPPY_CLICK_DISTANCE = 5;
const SCROLL_INTERVAL = 250;

export interface DraggingColumn {
  index: VisibleIndex;
  depth: number;
}

interface ColumnInfo {
  visibleIndex: VisibleIndex;
  modelIndex: ModelIndex;
  left: number;
  right: number;
}

function getColumnInfo(
  visibleIndex: VisibleIndex | null,
  metrics: GridMetrics
): ColumnInfo | null {
  const {
    modelColumns,
    movedColumns,
    visibleColumnXs,
    columnCount,
    visibleColumnWidths,
    userColumnWidths,
    calculatedColumnWidths,
  } = metrics;

  if (visibleIndex == null || visibleIndex > columnCount || visibleIndex < 0) {
    return null;
  }

  const modelIndex =
    modelColumns.get(visibleIndex) ??
    GridUtils.getModelIndex(visibleIndex, movedColumns);

  const left = visibleColumnXs.get(visibleIndex);

  if (left == null) {
    return null;
  }

  const right =
    left +
    (visibleColumnWidths.get(visibleIndex) ??
      userColumnWidths.get(modelIndex) ??
      calculatedColumnWidths.get(modelIndex) ??
      0);

  return {
    visibleIndex,
    modelIndex,
    left,
    right,
  };
}

class GridColumnMoveMouseHandler extends GridMouseHandler {
  cursor: string | null = null;

  private draggingOffset?: number;

  private startingGridPoint?: GridPoint;

  private sloppyClickThreshold = false;

  private scrollingInterval?: number;

  private scrollingDirection?: 'left' | 'right';

  private setScrollInterval(grid: Grid, direction: 'left' | 'right'): void {
    if (
      this.scrollingInterval != null &&
      direction === this.scrollingDirection
    ) {
      return;
    }

    this.scrollingDirection = direction;
    this.scrollingInterval = window.setInterval(() => {
      const { metrics } = grid;
      if (!metrics) {
        return;
      }

      const { left, lastLeft } = metrics;

      if (
        (direction === 'left' && left === 0) ||
        (direction === 'right' && left === lastLeft)
      ) {
        if (left === 0) {
          grid.setState({ leftOffset: 0 });
        }
        this.clearScrollInterval();
        return;
      }

      grid.setState({ left: direction === 'left' ? left - 1 : left + 1 });
    }, SCROLL_INTERVAL);
  }

  private clearScrollInterval(): void {
    this.scrollingDirection = undefined;
    window.clearInterval(this.scrollingInterval);
    this.scrollingInterval = undefined;
  }

  onLeave(): EventHandlerResult {
    this.clearScrollInterval();
    return false;
  }

  onDown(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    const { model } = grid.props;
    const { x, column, columnHeaderDepth } = gridPoint;
    const { metrics } = grid;
    if (!metrics) throw new Error('Metrics not set');

    const { rowHeaderWidth, visibleColumnXs, modelColumns } = metrics;

    if (column == null || columnHeaderDepth !== 0) {
      return false;
    }

    this.startingGridPoint = gridPoint;
    this.sloppyClickThreshold = false;
    this.cursor = null;
    const modelColumn = modelColumns.get(column);

    if (
      modelColumn != null &&
      columnHeaderDepth != null &&
      model.isColumnMovable(modelColumn, columnHeaderDepth)
    ) {
      const columnX = getOrThrow(visibleColumnXs, column);
      this.draggingOffset = x - columnX - rowHeaderWidth;
      grid.setState({ draggingColumnOffset: this.draggingOffset });
    }
    return false;
  }

  onDrag(
    gridPoint: GridPoint,
    grid: Grid,
    event: GridMouseEvent
  ): EventHandlerResult {
    if (
      this.draggingOffset === undefined ||
      this.startingGridPoint === undefined
    ) {
      return false;
    }

    const {
      x: mouseX,
      y: mouseY,
      column: visibleIndex,
      columnHeaderDepth,
    } = gridPoint;

    const { model } = grid.props;
    let { draggingColumn, movedColumns } = grid.state;
    const { isDragging } = grid.state;
    const { metrics } = grid;

    if (!metrics) throw new Error('Metrics not set');

    const {
      leftVisible,
      width,
      rightVisible,
      columnCount,
      rowHeaderWidth,
      visibleColumnWidths,
      userColumnWidths,
      calculatedColumnWidths,
      visibleColumnXs,
      modelColumns,
      floatingLeftWidth,
    } = metrics;

    const modelIndex =
      visibleIndex != null ? modelColumns.get(visibleIndex) : null;

    if (
      mouseX == null ||
      mouseY == null ||
      visibleIndex == null ||
      modelIndex == null
    ) {
      return false;
    }

    // before considering it a drag, the mouse must have moved a minimum distance
    // this prevents click actions from triggering a drag state
    if (
      (!this.sloppyClickThreshold &&
        Math.abs(this.startingGridPoint.x - mouseX) >= SLOPPY_CLICK_DISTANCE) ||
      Math.abs(this.startingGridPoint.y - mouseY) >= SLOPPY_CLICK_DISTANCE
    ) {
      this.sloppyClickThreshold = true;
    } else if (!this.sloppyClickThreshold && !isDragging) {
      return false;
    }

    if (draggingColumn == null) {
      const startColumnInfo = getColumnInfo(
        this.startingGridPoint.column,
        metrics
      );
      if (!startColumnInfo) {
        return false;
      }

      if (
        startColumnInfo.visibleIndex != null &&
        !model.isColumnMovable(startColumnInfo.modelIndex)
      ) {
        return false;
      }

      draggingColumn = null;
      if (startColumnInfo.visibleIndex != null && columnHeaderDepth != null) {
        draggingColumn = {
          index: startColumnInfo.visibleIndex,
          depth: columnHeaderDepth,
        };
      }

      grid.setState({ draggingColumn, isDragging: true });

      if (draggingColumn == null) {
        return false;
      }
    }

    this.cursor = 'move';

    const draggingColumnInfo = getColumnInfo(draggingColumn.index, metrics);
    if (!draggingColumnInfo) {
      return false;
    }
    const { depth: draggingColumnDepth } = draggingColumn;
    let draggingVisibleIndex = draggingColumnInfo.visibleIndex;
    const draggingModelIndex = draggingColumnInfo.modelIndex;

    const draggingColumnLeft = mouseX - this.draggingOffset;
    const draggingColumnRight =
      draggingColumnLeft +
      (visibleColumnWidths.get(draggingVisibleIndex) ??
        userColumnWidths.get(draggingModelIndex) ??
        calculatedColumnWidths.get(draggingModelIndex) ??
        0);

    const isDraggingLeft = draggingColumnLeft < draggingColumnInfo.left;
    const isDraggingRight = draggingColumnRight > draggingColumnInfo.right;
    if (!isDraggingLeft && !isDraggingRight) {
      return true;
    }
    const swapColumnInfo = getColumnInfo(
      isDraggingLeft ? draggingVisibleIndex - 1 : draggingVisibleIndex + 1,
      metrics
    );

    if (!swapColumnInfo) {
      return true;
    }

    const switchPoint =
      getOrThrow(visibleColumnXs, swapColumnInfo.visibleIndex) +
      getOrThrow(visibleColumnWidths, swapColumnInfo.visibleIndex) * 0.5 +
      rowHeaderWidth;

    if (visibleIndex === draggingVisibleIndex) {
      return true;
    }

    if (
      !model.isColumnMovableTo(draggingModelIndex, modelIndex)
      // !model.isColumnMovableTo(draggingModelIndex, swapColumnInfo.modelIndex)
    ) {
      this.clearScrollInterval();

      this.draggingOffset +=
        draggingColumnLeft - (visibleColumnXs.get(draggingVisibleIndex) ?? 0);

      grid.setState({ draggingColumnOffset: this.draggingOffset });
      return true;
    }

    if (draggingColumnLeft < floatingLeftWidth) {
      this.setScrollInterval(grid, 'left');
    } else if (draggingColumnRight > width) {
      this.setScrollInterval(grid, 'right');
    } else {
      this.clearScrollInterval();
    }

    if (
      isDraggingLeft &&
      draggingVisibleIndex > leftVisible &&
      draggingColumnLeft < switchPoint &&
      model.isColumnDroppableBetween(
        draggingModelIndex,
        visibleIndex > 0
          ? modelColumns.get(visibleIndex - 1) ??
              GridUtils.getModelIndex(visibleIndex - 1, movedColumns)
          : null,
        modelIndex,
        draggingColumnDepth
      )
    ) {
      movedColumns = GridUtils.moveItem(
        draggingVisibleIndex,
        visibleIndex,
        movedColumns
      );
      draggingVisibleIndex = visibleIndex;
    } else if (
      !isDraggingLeft &&
      draggingVisibleIndex < rightVisible &&
      draggingColumnRight > switchPoint &&
      model.isColumnDroppableBetween(
        draggingModelIndex,
        modelIndex,
        visibleIndex < columnCount + 1
          ? modelColumns.get(visibleIndex + 1) ??
              GridUtils.getModelIndex(visibleIndex + 1, movedColumns)
          : null,
        draggingColumnDepth
      )
    ) {
      movedColumns = GridUtils.moveItem(
        draggingVisibleIndex,
        visibleIndex,
        movedColumns
      );
      draggingVisibleIndex = visibleIndex;
    }
    grid.setState({
      movedColumns,
      draggingColumn: {
        index: draggingVisibleIndex,
        depth: draggingColumnDepth,
      },
    });

    return true;
  }

  onUp(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    this.cursor = null;

    this.clearScrollInterval();

    if (this.draggingOffset != null) {
      this.draggingOffset = undefined;
      grid.setState({
        draggingColumnOffset: null,
        draggingColumn: null,
        isDragging: false,
      });
      return true;
    }

    return false;
  }
}

export default GridColumnMoveMouseHandler;
