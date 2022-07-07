import Grid from '../Grid';
import GridUtils, { GridPoint } from '../GridUtils';
import GridMouseHandler, { GridMouseEvent } from '../GridMouseHandler';
import { EventHandlerResult } from '../EventHandlerResult';
import type { VisibleIndex, ModelIndex, GridMetrics } from '../GridMetrics';
import { BoundedAxisRange, GridModel } from '..';

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
  isColumnGroup: boolean;
  range: BoundedAxisRange;
}

/**
 * Gets info about a visible column
 * @param visibleIndex The visible index to get info for
 * @param depth The header depth to get info for
 * @param metrics Grid metrics
 * @param model Grid model
 * @returns The column info at the depth.
 * If the column is not in a group at that depth, returns the info for the base column.
 * Returns null if the column is not visible.
 */
function getColumnInfo(
  visibleIndex: VisibleIndex | null,
  depth: number | undefined,
  metrics: GridMetrics,
  model: GridModel
): ColumnInfo | null {
  const {
    modelColumns,
    movedColumns,
    visibleColumnXs,
    columnCount,
    visibleColumnWidths,
    userColumnWidths,
    calculatedColumnWidths,
    floatingLeftWidth,
    maxX,
  } = metrics;

  if (
    depth == null ||
    visibleIndex == null ||
    visibleIndex > columnCount ||
    visibleIndex < 0
  ) {
    return null;
  }

  const modelIndex =
    modelColumns.get(visibleIndex) ??
    GridUtils.getModelIndex(visibleIndex, movedColumns);

  const group = model.getColumnHeaderGroup(modelIndex, depth);
  const isColumnGroup = group != null;

  let left: number;
  let right: number;
  let range: BoundedAxisRange;

  if (group != null) {
    const [startVisibleIndex, endVisibleIndex] = group.getVisibleRange(
      movedColumns
    );

    left = visibleColumnXs.get(startVisibleIndex) ?? floatingLeftWidth;
    right =
      (visibleColumnXs.get(endVisibleIndex) ?? maxX) +
      (visibleColumnWidths.get(endVisibleIndex) ?? 0);
    range = [startVisibleIndex, endVisibleIndex];
  } else {
    const possibleLeft = visibleColumnXs.get(visibleIndex);
    if (possibleLeft == null) {
      return null;
    }

    left = possibleLeft;
    right =
      left +
      (visibleColumnWidths.get(visibleIndex) ??
        userColumnWidths.get(modelIndex) ??
        calculatedColumnWidths.get(modelIndex) ??
        0);
    range = [visibleIndex, visibleIndex];
  }

  return {
    visibleIndex,
    modelIndex,
    left,
    right,
    isColumnGroup,
    range,
  };
}

class GridColumnMoveMouseHandler extends GridMouseHandler {
  cursor: string | null = null;

  private draggingOffset?: number;

  private initialOffset?: number;

  private initialGridPoint?: GridPoint;

  private isDragging = false;

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
      let { metrics } = grid;
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

      grid.updateMetrics(grid.state);
      metrics = grid.metrics;
      const { mouseX, mouseY } = grid.state;

      if (!metrics || mouseX == null || mouseY == null) {
        return;
      }

      this.moveDraggingSection(
        GridUtils.getGridPointFromXY(mouseX, mouseY, metrics),
        grid
      );
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

    const columnInfo = getColumnInfo(column, columnHeaderDepth, metrics, model);

    if (column == null || columnInfo == null || columnHeaderDepth == null) {
      return false;
    }

    // Can't drag a base column from the empty group area
    if (columnHeaderDepth > 0 && !columnInfo.isColumnGroup) {
      return false;
    }

    const { rowHeaderWidth } = metrics;

    this.initialGridPoint = gridPoint;
    this.isDragging = false;
    this.cursor = null;

    if (
      columnInfo.modelIndex != null &&
      columnHeaderDepth != null &&
      model.isColumnMovable(columnInfo.modelIndex, columnHeaderDepth)
    ) {
      this.draggingOffset = x - columnInfo.left - rowHeaderWidth;
      this.initialOffset = this.draggingOffset;
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
      this.initialGridPoint === undefined ||
      this.initialOffset === undefined
    ) {
      return false;
    }

    const { x: mouseX, y: mouseY } = gridPoint;
    const { columnHeaderDepth } = this.initialGridPoint;

    const { model } = grid.props;
    let { draggingColumn } = grid.state;
    const { metrics } = grid;

    if (!metrics) throw new Error('Metrics not set');

    // before considering it a drag, the mouse must have moved a minimum distance
    // this prevents click actions from triggering a drag state
    if (!this.isDragging) {
      if (
        Math.abs(this.initialGridPoint.x - mouseX) >= SLOPPY_CLICK_DISTANCE ||
        Math.abs(this.initialGridPoint.y - mouseY) >= SLOPPY_CLICK_DISTANCE
      ) {
        this.isDragging = true;
      } else {
        return false;
      }
    }

    // Get the initial dragging column info
    if (draggingColumn == null) {
      const initialColumnInfo = getColumnInfo(
        this.initialGridPoint.column,
        columnHeaderDepth,
        metrics,
        model
      );

      if (!initialColumnInfo || columnHeaderDepth == null) {
        return false;
      }

      if (!model.isColumnMovable(initialColumnInfo.modelIndex)) {
        return false;
      }

      if (columnHeaderDepth > 0 && !initialColumnInfo.isColumnGroup) {
        return false;
      }

      draggingColumn = null;
      if (initialColumnInfo.range[0] != null) {
        draggingColumn = {
          index: initialColumnInfo.range[0],
          depth: columnHeaderDepth,
        };
      }

      grid.setState({ draggingColumn, isDragging: true });

      if (draggingColumn == null) {
        return false;
      }
    }

    /**
     * At this point, we have determined we are actually dragging a column
     */
    this.cursor = 'move';

    this.moveDraggingSection(gridPoint, grid, event);

    return true;
  }

  moveDraggingSection(
    gridPoint: GridPoint,
    grid: Grid,
    event?: GridMouseEvent
  ): void {
    if (
      this.draggingOffset === undefined ||
      this.initialGridPoint === undefined ||
      this.initialOffset === undefined
    ) {
      return;
    }

    const { x: mouseX } = gridPoint;
    const { columnHeaderDepth } = this.initialGridPoint;

    const { model } = grid.props;
    const { draggingColumn } = grid.state;
    let { movedColumns } = grid.state;
    const { metrics } = grid;

    if (!metrics) throw new Error('Metrics not set');
    if (!draggingColumn) return;

    const {
      leftVisible,
      rightVisible,
      rowHeaderWidth,
      modelColumns,
      floatingLeftWidth,
      width,
    } = metrics;

    const draggingColumnInfo = getColumnInfo(
      draggingColumn.index,
      columnHeaderDepth,
      metrics,
      model
    );
    if (!draggingColumnInfo) {
      return;
    }

    const { depth: draggingColumnDepth } = draggingColumn;
    let draggingVisibleIndex = draggingColumnInfo.visibleIndex;
    const draggingModelIndex = draggingColumnInfo.modelIndex;

    const startColumn = getColumnInfo(
      draggingColumnInfo.range[0],
      0,
      metrics,
      model
    );
    const endColumn = getColumnInfo(
      draggingColumnInfo.range[1],
      0,
      metrics,
      model
    );

    // Group spans the entire table. Drag and drop would be wonky
    if (!startColumn && !endColumn) {
      return;
    }

    const draggingColumnLeft = mouseX - this.draggingOffset;
    const draggingColumnRight =
      draggingColumnLeft + (draggingColumnInfo.right - draggingColumnInfo.left);

    const { movementX = 0 } = event || {};

    const isDraggingLeft = movementX < 0 || this.scrollingDirection === 'left';
    const isDraggingRight =
      movementX > 0 || this.scrollingDirection === 'right';
    if (!isDraggingLeft && !isDraggingRight) {
      return;
    }

    const swapGroupInfo = getColumnInfo(
      GridUtils.getColumnAtX(
        isDraggingLeft ? draggingColumnLeft : draggingColumnRight,
        metrics
      ),
      columnHeaderDepth,
      metrics,
      model
    );

    if (!swapGroupInfo) {
      return;
    }

    const swapVisibleIndex = isDraggingLeft
      ? swapGroupInfo.range[0]
      : swapGroupInfo.range[1];

    const swapModelIndex = GridUtils.getModelIndex(
      swapVisibleIndex,
      movedColumns
    );

    const switchPoint =
      swapGroupInfo.left +
      (swapGroupInfo.right - swapGroupInfo.left) * 0.5 +
      rowHeaderWidth;

    // Cursor has moved past the column drag bounds, don't move the column until we hit the initial offset point again
    if (this.initialOffset !== this.draggingOffset) {
      // Pre move < Initial < Post move or vice-versa
      // User crossed back past the iniital offset point, so we can start moving again
      if (
        (this.draggingOffset < this.initialOffset &&
          this.initialOffset < this.draggingOffset + movementX) ||
        (this.draggingOffset > this.initialOffset &&
          this.initialOffset > this.draggingOffset + movementX)
      ) {
        this.draggingOffset = this.initialOffset;
        grid.setState({ draggingColumnOffset: this.draggingOffset });
      } else {
        // Column can't move since we aren't back at the initial offset yet
        this.draggingOffset += movementX;
        grid.setState({ draggingColumnOffset: this.draggingOffset });
        return;
      }
    }

    // Column can't continue moving in this direction. Pin the left/right side and adjust offset
    if (
      !model.isColumnMovableTo(
        draggingModelIndex,
        swapGroupInfo.modelIndex,
        draggingColumnDepth
      )
    ) {
      this.draggingOffset =
        mouseX -
        (isDraggingLeft ? swapGroupInfo.right : draggingColumnInfo.left);
      this.clearScrollInterval();
      grid.setState({ draggingColumnOffset: this.draggingOffset });
      return;
    }

    if (draggingColumnLeft <= floatingLeftWidth) {
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
        swapModelIndex,
        modelColumns.get(swapVisibleIndex - 1) ??
          GridUtils.getModelIndex(swapVisibleIndex - 1, movedColumns),
        draggingColumnDepth
      )
    ) {
      if (draggingColumnInfo.isColumnGroup) {
        movedColumns = GridUtils.moveRange(
          draggingColumnInfo.range,
          swapVisibleIndex,
          movedColumns
        );
      } else {
        movedColumns = GridUtils.moveItem(
          draggingVisibleIndex,
          swapVisibleIndex,
          movedColumns
        );
      }
      draggingVisibleIndex = swapVisibleIndex;
    } else if (
      isDraggingRight &&
      draggingVisibleIndex < rightVisible &&
      draggingColumnRight > switchPoint &&
      model.isColumnDroppableBetween(
        draggingModelIndex,
        swapModelIndex,
        modelColumns.get(swapVisibleIndex + 1) ??
          GridUtils.getModelIndex(swapVisibleIndex + 1, movedColumns),
        draggingColumnDepth
      )
    ) {
      if (draggingColumnInfo.isColumnGroup) {
        movedColumns = GridUtils.moveRange(
          draggingColumnInfo.range,
          swapVisibleIndex -
            (draggingColumnInfo.range[1] - draggingColumnInfo.range[0]),
          movedColumns
        );
      } else {
        movedColumns = GridUtils.moveItem(
          draggingVisibleIndex,
          swapVisibleIndex,
          movedColumns
        );
      }
      draggingVisibleIndex = swapVisibleIndex;
    }
    grid.setState({
      movedColumns,
      draggingColumn: {
        index: draggingVisibleIndex,
        depth: draggingColumnDepth,
      },
    });
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
