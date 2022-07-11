import clamp from 'lodash.clamp';
import Grid from '../Grid';
import GridUtils, { GridPoint } from '../GridUtils';
import GridMouseHandler, { GridMouseEvent } from '../GridMouseHandler';
import { EventHandlerResult } from '../EventHandlerResult';
import type {
  VisibleIndex,
  ModelIndex,
  GridMetrics,
  MoveOperation,
} from '../GridMetrics';
import type { BoundedAxisRange } from '../GridAxisRange';
import type GridModel from '../GridModel';

const SLOPPY_CLICK_DISTANCE = 5;
const SCROLL_INTERVAL = 1000 / 60;
const SCROLL_DELTA = 10;

export interface DraggingColumn {
  range: BoundedAxisRange;
  depth: number;
}

interface ColumnInfo {
  visibleIndex: VisibleIndex;
  modelIndex: ModelIndex;
  left: number;
  right: number;
  width: number;
  isColumnGroup: boolean;
  range: BoundedAxisRange;
  depth: number;
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
    width: right - left,
    isColumnGroup,
    range,
    depth,
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

  private draggingDirection?: 'left' | 'right';

  private draggingColumn: DraggingColumn | null = null;

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

      const {
        left,
        lastLeft,
        leftOffset,
        userColumnWidths,
        calculatedColumnWidths,
        movedColumns,
        visibleColumnWidths,
      } = metrics;

      let nextLeft = left;
      let nextOffset = leftOffset;
      if (direction === 'left') {
        nextOffset -= SCROLL_DELTA;
        while (nextOffset < 0) {
          nextLeft -= 1;
          const modelIndex = GridUtils.getModelIndex(left - 1, movedColumns);
          const prevColumnWidth =
            userColumnWidths.get(modelIndex) ??
            calculatedColumnWidths.get(modelIndex);
          if (prevColumnWidth === undefined) {
            nextOffset = 0;
          } else {
            nextOffset += prevColumnWidth;
          }
          if (nextLeft < 0) {
            nextOffset = 0;
            nextLeft = 0;
          }
        }
      } else {
        nextOffset += SCROLL_DELTA;
        let leftColumnWidth = visibleColumnWidths.get(left);
        while (leftColumnWidth !== undefined && nextOffset > leftColumnWidth) {
          if (nextLeft === lastLeft) {
            nextOffset = 0;
          } else {
            if (nextLeft === lastLeft) {
              nextOffset = 0;
            } else {
              nextLeft += 1;
              nextOffset -= leftColumnWidth;
            }
            const modelIndex = GridUtils.getModelIndex(left + 1, movedColumns);
            leftColumnWidth =
              userColumnWidths.get(modelIndex) ??
              calculatedColumnWidths.get(modelIndex);
          }
        }
      }

      grid.setState({ left: nextLeft, leftOffset: nextOffset });

      metrics = grid.updateMetrics(grid.state);
      const { mouseX, mouseY } = grid.state;

      if (!metrics || mouseX == null || mouseY == null) {
        return;
      }

      this.moveDraggingColumn(
        GridUtils.getGridPointFromXY(mouseX, mouseY, metrics),
        grid,
        direction === 'left' ? -SCROLL_DELTA : SCROLL_DELTA
      );

      if (
        (direction === 'left' && nextLeft === 0 && leftOffset === 0) ||
        (direction === 'right' && nextLeft === lastLeft)
      ) {
        this.clearScrollInterval();
      }
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
    this.draggingColumn = null;
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
    // let { draggingColumn } = grid.state;
    let { draggingColumn } = this;
    const { metrics } = grid;

    if (!metrics) throw new Error('Metrics not set');

    // before considering it a drag, the mouse must have moved a minimum distance
    // this prevents click actions from triggering a drag state
    if (
      !draggingColumn &&
      Math.abs(this.initialGridPoint.x - mouseX) < SLOPPY_CLICK_DISTANCE &&
      Math.abs(this.initialGridPoint.y - mouseY) < SLOPPY_CLICK_DISTANCE
    ) {
      return false;
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

      // Disallow dragging from the blank space in column header groups
      if (columnHeaderDepth > 0 && !initialColumnInfo.isColumnGroup) {
        return false;
      }

      if (initialColumnInfo.range[0] == null) {
        return false;
      }

      draggingColumn = {
        range: initialColumnInfo.range,
        depth: columnHeaderDepth,
      };

      const startColumn = getColumnInfo(
        draggingColumn.range[0],
        0,
        metrics,
        model
      );
      const endColumn = getColumnInfo(
        draggingColumn.range[1],
        0,
        metrics,
        model
      );

      // Group goes off the table. Drag and drop could be wonky here
      // Column draws only use columns that are partially visible too
      // So this could cause rendering errors if we tried dragging it
      if (!startColumn || !endColumn) {
        return false;
      }

      this.draggingColumn = draggingColumn;
      grid.setState({ draggingColumn, isDragging: true });
    }

    /**
     * At this point, we have determined we are actually dragging a column
     */
    this.cursor = 'move';
    if (event.movementX !== 0) {
      this.draggingDirection = event.movementX < 0 ? 'left' : 'right';
    } else {
      this.draggingDirection = undefined;
    }

    this.moveDraggingColumn(gridPoint, grid, event.movementX);

    return true;
  }

  moveDraggingColumn(gridPoint: GridPoint, grid: Grid, deltaX: number): void {
    if (
      this.draggingOffset === undefined ||
      this.initialGridPoint === undefined ||
      this.initialOffset === undefined ||
      this.draggingColumn == null ||
      deltaX === 0
    ) {
      return;
    }

    const { x: mouseX } = gridPoint;
    const { depth: draggingColumnDepth } = this.draggingColumn;

    const { model } = grid.props;
    let { movedColumns } = grid.state;
    const { metrics } = grid;

    if (!metrics) throw new Error('Metrics not set');

    const { floatingLeftWidth, width } = metrics;

    const isDraggingLeft = deltaX < 0;

    const draggingColumn = getColumnInfo(
      this.draggingColumn.range[0],
      draggingColumnDepth,
      metrics,
      model
    );

    if (!draggingColumn) {
      return;
    }

    // The returned left/right are the original position, not dragged position
    // This is where we could potentially have the column
    draggingColumn.left = mouseX - this.draggingOffset;
    draggingColumn.right = draggingColumn.left + draggingColumn.width;

    const previousLeft = draggingColumn.left - deltaX;
    const previousRight = draggingColumn.right - deltaX;

    const prevSwapColumn = getColumnInfo(
      GridUtils.getColumnAtX(
        clamp(
          isDraggingLeft ? previousLeft : previousRight,
          floatingLeftWidth + 1,
          width
        ),
        metrics,
        true
      ),
      draggingColumnDepth,
      metrics,
      model
    );

    const swapColumn = getColumnInfo(
      GridUtils.getColumnAtX(
        clamp(
          isDraggingLeft ? draggingColumn.left : draggingColumn.right,
          floatingLeftWidth + 1,
          width
        ),
        metrics,
        true
      ),
      draggingColumnDepth,
      metrics,
      model
    );

    if (!swapColumn || !prevSwapColumn) {
      return;
    }

    // Cursor has moved past the column drag bounds, don't move the column until we hit the initial offset point again
    if (this.initialOffset !== this.draggingOffset) {
      // Pre move < Initial < Post move or vice-versa
      // User crossed back past the iniital offset point, so we can start moving again
      if (
        (this.draggingOffset < this.initialOffset &&
          this.initialOffset < this.draggingOffset + deltaX) ||
        (this.draggingOffset > this.initialOffset &&
          this.initialOffset > this.draggingOffset + deltaX)
      ) {
        this.draggingOffset = this.initialOffset;
        grid.setState({ draggingColumnOffset: this.draggingOffset });
      } else {
        // Column can't move since we aren't back at the initial offset yet
        this.draggingOffset += deltaX;
        grid.setState({ draggingColumnOffset: this.draggingOffset });
        return;
      }
    }

    // Column can't continue moving in this direction. Pin the left/right side and adjust offset
    if (
      !model.isColumnMovableTo(
        draggingColumn.modelIndex,
        swapColumn.modelIndex,
        draggingColumnDepth
      )
    ) {
      this.draggingOffset =
        mouseX - (isDraggingLeft ? swapColumn.right : previousLeft);
      this.clearScrollInterval();
      grid.setState({ draggingColumnOffset: this.draggingOffset });
      return;
    }

    if (draggingColumn.left <= floatingLeftWidth) {
      this.setScrollInterval(grid, 'left');
    } else if (draggingColumn.right > width) {
      this.setScrollInterval(grid, 'right');
    } else {
      this.clearScrollInterval();
    }

    // Can't swap a column with itself
    if (swapColumn.visibleIndex === draggingColumn.visibleIndex) {
      return;
    }

    const columnMove = this.swapColumns(
      draggingColumn,
      swapColumn,
      movedColumns,
      model
    );

    if (!columnMove) {
      // No swap occurred
      return;
    }

    movedColumns = [...movedColumns, columnMove];

    const newDraggingRange = GridUtils.applyItemMoves(
      draggingColumn.range[0],
      draggingColumn.range[1],
      [columnMove]
    );

    this.draggingColumn = {
      range: newDraggingRange[0],
      depth: this.draggingColumn.depth,
    };

    grid.setState({
      movedColumns,
      draggingColumn: this.draggingColumn,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  swapColumns(
    draggingColumn: ColumnInfo,
    swapColumn: ColumnInfo,
    movedColumns: MoveOperation[],
    model: GridModel
  ): MoveOperation | null {
    const isDraggingLeft =
      swapColumn.visibleIndex < draggingColumn.visibleIndex;

    if (swapColumn.visibleIndex === draggingColumn.visibleIndex) {
      return null;
    }

    const switchPoint = swapColumn.left + swapColumn.width * 0.5;

    if (
      isDraggingLeft &&
      draggingColumn.left < switchPoint &&
      model.isColumnDroppableBetween(
        draggingColumn.modelIndex,
        GridUtils.getModelIndex(swapColumn.range[0], movedColumns),
        GridUtils.getModelIndex(swapColumn.range[0] - 1, movedColumns),
        draggingColumn.depth
      )
    ) {
      return {
        from: draggingColumn.isColumnGroup
          ? draggingColumn.range
          : draggingColumn.range[0],
        to: swapColumn.range[0],
      };
    }

    if (
      !isDraggingLeft &&
      draggingColumn.right > switchPoint &&
      model.isColumnDroppableBetween(
        draggingColumn.modelIndex,
        GridUtils.getModelIndex(swapColumn.range[1], movedColumns),
        GridUtils.getModelIndex(swapColumn.range[1] + 1, movedColumns),
        draggingColumn.depth
      )
    ) {
      return {
        from: draggingColumn.isColumnGroup
          ? draggingColumn.range
          : draggingColumn.range[0],
        to:
          swapColumn.range[1] -
          (draggingColumn.range[1] - draggingColumn.range[0]),
      };
    }

    return null;
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
