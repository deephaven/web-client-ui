import GridUtils from '../GridUtils';
import GridMouseHandler from '../GridMouseHandler';

const SLOPPY_CLICK_DISTANCE = 5;

class GridColumnMoveMouseHandler extends GridMouseHandler {
  cursor = null;

  draggingOffset = null;

  startingGridPoint = null;

  sloppyClickThreshold = false;

  onDown(gridPoint, grid) {
    const { model } = grid.props;
    const { x, y, column } = gridPoint;
    const { metrics } = grid;
    const { columnHeaderHeight, rowHeaderWidth, visibleColumnXs } = metrics;

    this.startingGridPoint = gridPoint;
    this.sloppyClickThreshold = false;
    this.cursor = null;

    if (
      column != null &&
      y <= columnHeaderHeight &&
      model.isColumnMovable(column)
    ) {
      const columnX = visibleColumnXs.get(column);
      this.draggingOffset = x - columnX - rowHeaderWidth;
      grid.setState({ draggingColumnOffset: this.draggingOffset });
    }
    return false;
  }

  onDrag(gridPoint, grid) {
    if (this.draggingOffset == null) {
      return false;
    }

    const { model } = grid.props;
    let { draggingColumn } = grid.state;
    const { mouseX, mouseY, isDragging } = grid.state;
    if (mouseX == null || mouseY == null) {
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
      const { column } = grid.getGridPointFromXY(mouseX, mouseY);
      if (column != null && !model.isColumnMovable(column)) {
        return false;
      }

      draggingColumn = column;

      grid.setState({ draggingColumn, isDragging: true });

      if (draggingColumn == null) {
        return false;
      }
    }

    this.cursor = 'move';
    const { metrics } = grid;
    const {
      left,
      lastLeft,
      right,
      rightVisible,
      columnCount,
      rowHeaderWidth,
      visibleColumnWidths,
      visibleColumnXs,
      width,
    } = metrics;
    let minX = rowHeaderWidth;
    if (left < draggingColumn) {
      const leftColumn = draggingColumn - 1;
      minX =
        visibleColumnXs.get(leftColumn) +
        visibleColumnWidths.get(leftColumn) * 0.5 +
        this.draggingOffset +
        rowHeaderWidth;
    }

    let maxX = width;
    if (draggingColumn < right) {
      const rightColumn = draggingColumn + 1;
      maxX =
        visibleColumnXs.get(rightColumn) +
        visibleColumnWidths.get(rightColumn) * 0.5 -
        visibleColumnWidths.get(draggingColumn) +
        this.draggingOffset +
        rowHeaderWidth;
    }

    let { movedColumns } = grid.state;
    if (
      mouseX < minX &&
      draggingColumn > 0 &&
      model.isColumnMovable(draggingColumn - 1)
    ) {
      movedColumns = GridUtils.moveItem(
        draggingColumn,
        draggingColumn - 1,
        movedColumns
      );
      draggingColumn -= 1;
    } else if (
      maxX < mouseX &&
      draggingColumn < columnCount - 1 &&
      model.isColumnMovable(draggingColumn + 1)
    ) {
      movedColumns = GridUtils.moveItem(
        draggingColumn,
        draggingColumn + 1,
        movedColumns
      );
      draggingColumn += 1;
    }
    grid.setState({ movedColumns, draggingColumn });

    const minMoveX = rowHeaderWidth + visibleColumnWidths.get(left) * 0.5;
    const maxMoveX =
      rowHeaderWidth +
      visibleColumnXs.get(rightVisible) +
      visibleColumnWidths.get(rightVisible) * 0.5;
    if (mouseX < minMoveX && left > 0) {
      grid.setState({ left: left - 1 });
    } else if (mouseX > maxMoveX && left < lastLeft) {
      grid.setState({ left: left + 1 });
    }

    return true;
  }

  onUp(_, grid) {
    this.cursor = null;

    if (this.draggingOffset != null) {
      this.draggingOffset = null;
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
