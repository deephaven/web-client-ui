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
  Coordinate,
} from '../GridMetrics';
import type { BoundedAxisRange } from '../GridAxisRange';
import type GridModel from '../GridModel';
import type { IColumnHeaderGroup } from '../ColumnHeaderGroup';

const SLOPPY_CLICK_DISTANCE = 5;
const SCROLL_INTERVAL = 1000 / 60;
const SCROLL_DELTA = 10;

export interface DraggingColumn {
  range: BoundedAxisRange;
  depth: number;
  left: Coordinate;
  width: number;
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
    allColumnXs,
    columnCount,
    allColumnWidths,
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

    left = allColumnXs.get(startVisibleIndex) ?? floatingLeftWidth;
    right =
      (allColumnXs.get(endVisibleIndex) ?? maxX) +
      (allColumnWidths.get(endVisibleIndex) ?? 0);
    range = [startVisibleIndex, endVisibleIndex];
  } else {
    const possibleLeft = allColumnXs.get(visibleIndex);
    if (possibleLeft == null) {
      return null;
    }

    left = possibleLeft;
    right =
      left +
      (allColumnWidths.get(visibleIndex) ??
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

  private scrollingInterval?: number;

  private scrollingDirection?: 'left' | 'right';

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
      const { metrics } = grid;
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
        allColumnWidths,
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
        let leftColumnWidth = allColumnWidths.get(left);
        while (leftColumnWidth !== undefined && nextOffset > leftColumnWidth) {
          nextLeft += 1;
          nextOffset -= leftColumnWidth;
          const modelIndex = GridUtils.getModelIndex(left + 1, movedColumns);
          leftColumnWidth =
            userColumnWidths.get(modelIndex) ??
            calculatedColumnWidths.get(modelIndex);

          if (nextLeft > lastLeft) {
            nextOffset = 0;
            nextLeft = lastLeft;
          }
        }
      }

      const { mouseX, mouseY } = grid.state;

      if (metrics == null || mouseX == null || mouseY == null) {
        return;
      }

      this.moveDraggingColumn(
        mouseX,
        grid,
        direction === 'left' ? -SCROLL_DELTA : SCROLL_DELTA
      );
      grid.setState({ left: nextLeft, leftOffset: nextOffset });

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
    this.draggingColumn = null;
    this.cursor = null;

    if (
      columnInfo.modelIndex != null &&
      columnHeaderDepth != null &&
      model.isColumnMovable(columnInfo.modelIndex, columnHeaderDepth)
    ) {
      this.draggingOffset = x - columnInfo.left - rowHeaderWidth;
      this.initialOffset = this.draggingOffset;
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
        left: initialColumnInfo.left,
        width: initialColumnInfo.width,
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

    this.moveDraggingColumn(gridPoint.x, grid, event.movementX);

    return true;
  }

  /**
   * Moves a dragging column, if possible, the specified distance
   * @param mouseX The point the move was initiated from
   * @param grid The Grid component
   * @param deltaX The distance of the move
   */
  moveDraggingColumn(mouseX: number, grid: Grid, deltaX: number): void {
    if (
      this.draggingOffset === undefined ||
      this.initialGridPoint === undefined ||
      this.initialOffset === undefined ||
      this.draggingColumn == null ||
      deltaX === 0
    ) {
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
      } else {
        // Column can't move since we aren't back at the initial offset yet
        this.draggingOffset += deltaX;
      }

      this.draggingColumn = {
        ...this.draggingColumn,
        left: mouseX - this.draggingOffset,
      };
      grid.setState({ draggingColumn: this.draggingColumn });
      return;
    }

    const { depth: draggingColumnDepth } = this.draggingColumn;

    const { model } = grid.props;
    const { movedColumns } = grid.state;
    const { metrics } = grid;
    if (!metrics) throw new Error('Metrics not set');

    const {
      floatingLeftWidth,
      width,
      columnHeaderMaxDepth,
      allColumnXs,
    } = metrics;

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
    // This is where the dragging column's floating position accounting for dragged distance
    const floatingDraggingLeft = mouseX - this.draggingOffset;
    const floatingDraggingRight = floatingDraggingLeft + draggingColumn.width;

    this.draggingColumn = {
      ...this.draggingColumn,
      left: floatingDraggingLeft,
    };
    grid.setState({
      draggingColumn: this.draggingColumn,
    });

    const swapColumn = getColumnInfo(
      GridUtils.getColumnAtX(
        clamp(
          isDraggingLeft ? floatingDraggingLeft : floatingDraggingRight,
          floatingLeftWidth,
          width
        ),
        metrics,
        true
      ),
      draggingColumnDepth,
      metrics,
      model
    );

    const parentGroup = model.getColumnHeaderParentGroup(
      draggingColumn.modelIndex,
      draggingColumn.depth
    );

    if (!swapColumn) {
      return;
    }

    // Check if we should pin to the edge of the parent
    if (parentGroup !== undefined) {
      const parentVisibleRange = parentGroup.getVisibleRange(movedColumns);
      // Cannot move to this left position, pin to left of parent
      if (swapColumn.visibleIndex < parentVisibleRange[0]) {
        const newMovedColumns = this.moveColumn(
          draggingColumn,
          parentVisibleRange[0],
          movedColumns
        );

        this.draggingOffset =
          mouseX - (allColumnXs.get(parentVisibleRange[0]) ?? 0);
        this.draggingColumn = {
          ...this.draggingColumn,
          left: mouseX - this.draggingOffset,
        };
        this.clearScrollInterval();
        grid.setState({
          draggingColumn: this.draggingColumn,
          movedColumns: newMovedColumns,
        });
        return;
      }

      // Pin to the right of parent
      if (swapColumn.visibleIndex > parentVisibleRange[1]) {
        const newMovedColumns = this.moveColumn(
          draggingColumn,
          parentVisibleRange[1] -
            (draggingColumn.range[1] - draggingColumn.range[0]),
          movedColumns
        );

        const { right: parentRight = 0 } =
          getColumnInfo(parentVisibleRange[1], 0, metrics, model) ?? {};

        this.draggingOffset = mouseX - (parentRight - draggingColumn.width);
        this.draggingColumn = {
          ...this.draggingColumn,
          left: mouseX - this.draggingOffset,
        };
        this.clearScrollInterval();
        grid.setState({
          draggingColumn: this.draggingColumn,
          movedColumns: newMovedColumns,
        });
        return;
      }
    }

    // Hit an unmovable column, move to the first available position next to it
    if (!model.isColumnMovable(swapColumn.modelIndex)) {
      let toVisibleIndex = swapColumn.visibleIndex;
      if (isDraggingLeft) {
        toVisibleIndex += 1;
        while (
          toVisibleIndex < draggingColumn.visibleIndex &&
          !model.isColumnMovable(
            GridUtils.getModelIndex(toVisibleIndex, movedColumns)
          )
        ) {
          toVisibleIndex += 1;
        }
      } else {
        toVisibleIndex -= 1;
        while (
          toVisibleIndex > draggingColumn.visibleIndex &&
          !model.isColumnMovable(
            GridUtils.getModelIndex(toVisibleIndex, movedColumns)
          )
        ) {
          toVisibleIndex -= 1;
        }
      }

      if (toVisibleIndex !== draggingColumn.visibleIndex) {
        if (!isDraggingLeft) {
          // Offset for range if dragging right
          toVisibleIndex -= draggingColumn.range[1] - draggingColumn.range[0];
        }

        const newMovedColumns = this.moveColumn(
          draggingColumn,
          toVisibleIndex,
          movedColumns
        );

        grid.setState({
          movedColumns: newMovedColumns,
          draggingColumn: this.draggingColumn,
        });
      }

      const toColumnInfo = getColumnInfo(toVisibleIndex, 0, metrics, model);
      if (isDraggingLeft) {
        this.draggingOffset = mouseX - (toColumnInfo?.left ?? 0);
      } else {
        this.draggingOffset =
          mouseX - ((toColumnInfo?.right ?? 0) - draggingColumn.width);
      }

      this.draggingColumn = {
        ...this.draggingColumn,
        left: mouseX - this.draggingOffset,
      };

      grid.setState({
        draggingColumn: this.draggingColumn,
      });

      return;
    }

    if (floatingDraggingLeft <= floatingLeftWidth) {
      this.setScrollInterval(grid, 'left');
    } else if (floatingDraggingRight > width) {
      this.setScrollInterval(grid, 'right');
    } else {
      this.clearScrollInterval();
    }

    // Can't swap a column with itself
    if (swapColumn.visibleIndex === draggingColumn.visibleIndex) {
      return;
    }

    // Can't swap a column to the left when dragging right or vice versa
    if (
      (isDraggingLeft &&
        draggingColumn.visibleIndex < swapColumn.visibleIndex) ||
      (!isDraggingLeft && draggingColumn.visibleIndex > swapColumn.visibleIndex)
    ) {
      return;
    }

    const switchPoint = swapColumn.left + swapColumn.width * 0.5;
    const draggingParentGroup = model.getColumnHeaderParentGroup(
      draggingColumn.modelIndex,
      draggingColumn.depth
    );

    // Get the highest level group that is not the common base group
    // This group is what we need to drag past
    let maxDepthSwapGroup: IColumnHeaderGroup | undefined;
    let maxSwapDepth = (draggingParentGroup?.depth ?? columnHeaderMaxDepth) - 1;
    while (maxSwapDepth >= 0 && maxDepthSwapGroup === undefined) {
      maxDepthSwapGroup = model.getColumnHeaderGroup(
        swapColumn.modelIndex,
        maxSwapDepth
      );
      maxSwapDepth -= 1;
    }

    let newMovedColumns: readonly MoveOperation[] | undefined;

    if (
      isDraggingLeft &&
      floatingDraggingLeft < switchPoint &&
      (!maxDepthSwapGroup ||
        swapColumn.visibleIndex ===
          maxDepthSwapGroup.getVisibleRange(movedColumns)[0])
    ) {
      newMovedColumns = this.moveColumn(
        draggingColumn,
        swapColumn.range[0],
        movedColumns
      );
    }

    if (
      !isDraggingLeft &&
      floatingDraggingRight > switchPoint &&
      (!maxDepthSwapGroup ||
        swapColumn.visibleIndex ===
          maxDepthSwapGroup.getVisibleRange(movedColumns)[1])
    ) {
      newMovedColumns = this.moveColumn(
        draggingColumn,
        swapColumn.range[1] -
          (draggingColumn.range[1] - draggingColumn.range[0]),
        movedColumns
      );
    }

    if (!newMovedColumns) {
      return;
    }

    this.draggingColumn = {
      ...this.draggingColumn,
      left: floatingDraggingLeft,
    };

    grid.setState({
      movedColumns: newMovedColumns,
      draggingColumn: this.draggingColumn,
    });
  }

  /**
   * Applies the column move and updates draggingColumn in the mouse handler
   * Does not check if the move is valid
   * @param draggingColumn The dragging column info
   * @param to The index to move the column or range to
   * @param movedColumns The array of column moves
   * @returns A new array of column moves
   */
  moveColumn(
    draggingColumn: ColumnInfo,
    to: number,
    movedColumns: readonly MoveOperation[]
  ): MoveOperation[] {
    const newMovedColumns = draggingColumn.isColumnGroup
      ? GridUtils.moveRange(draggingColumn.range, to, movedColumns)
      : GridUtils.moveItem(draggingColumn.visibleIndex, to, movedColumns);

    const moveDistance = to - draggingColumn.range[0];
    const newDraggingRange: BoundedAxisRange = [
      draggingColumn.range[0] + moveDistance,
      draggingColumn.range[1] + moveDistance,
    ];

    if (this.draggingColumn) {
      this.draggingColumn = {
        ...this.draggingColumn,
        range: newDraggingRange,
      };
    }

    return newMovedColumns;
  }

  onUp(gridPoint: GridPoint, grid: Grid): EventHandlerResult {
    this.cursor = null;

    this.clearScrollInterval();

    if (this.draggingOffset != null) {
      this.draggingOffset = undefined;
      grid.setState({
        draggingColumn: null,
        isDragging: false,
      });
      return true;
    }

    return false;
  }
}

export default GridColumnMoveMouseHandler;
