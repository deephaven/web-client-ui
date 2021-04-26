import GridUtils from '../GridUtils';
import GridMouseHandler from '../GridMouseHandler';

class GridRowMoveMouseHandler extends GridMouseHandler {
  cursor = 'move';

  draggingOffset = null;

  onDown(gridPoint, grid) {
    const { model } = grid.props;
    const { x, y, row } = gridPoint;
    const { metrics } = grid;
    const { columnHeaderHeight, rowHeaderWidth, visibleRowYs } = metrics;

    if (x <= rowHeaderWidth && model.isRowMovable(row)) {
      const rowY = visibleRowYs.get(row);
      this.draggingOffset = y - rowY - columnHeaderHeight;
      grid.setState({ draggingRowOffset: this.draggingOffset });
    }
    return false;
  }

  onDrag(gridPoint, grid) {
    if (this.draggingOffset == null) {
      return false;
    }

    const { model } = grid.props;
    let { draggingRow } = grid.state;
    const { mouseX, mouseY } = grid.state;
    if (mouseX == null || mouseY == null) {
      return false;
    }

    if (draggingRow == null) {
      const { row } = grid.getGridPointFromXY(mouseX, mouseY);
      if (row != null && !model.isRowMovable(row)) {
        return false;
      }

      draggingRow = row;

      grid.setState({ draggingRow, isDragging: true });

      if (draggingRow == null) {
        return false;
      }
    }

    const { metrics } = grid;
    const {
      top,
      lastTop,
      bottom,
      bottomVisible,
      rowCount,
      columnHeaderHeight,
      visibleRowHeights,
      visibleRowYs,
      height,
    } = metrics;
    let minY = columnHeaderHeight;
    if (top < draggingRow) {
      const topRow = draggingRow - 1;
      minY =
        visibleRowYs.get(topRow) +
        visibleRowHeights.get(topRow) * 0.5 +
        columnHeaderHeight;
    }

    let maxY = height;
    if (draggingRow < bottom) {
      const bottomRow = draggingRow + 1;
      maxY =
        visibleRowYs.get(bottomRow) +
        visibleRowHeights.get(bottomRow) * 0.5 +
        columnHeaderHeight;
    }

    let { movedRows } = grid.state;
    if (
      mouseY < minY &&
      draggingRow > 0 &&
      model.isRowMovable(draggingRow - 1)
    ) {
      movedRows = GridUtils.moveItem(draggingRow, draggingRow - 1, movedRows);
      draggingRow -= 1;
    } else if (
      maxY < mouseY &&
      draggingRow < rowCount - 1 &&
      model.isRowMovable(draggingRow + 1)
    ) {
      movedRows = GridUtils.moveItem(draggingRow, draggingRow + 1, movedRows);
      draggingRow += 1;
    }
    grid.setState({ movedRows, draggingRow });

    const minMoveY = columnHeaderHeight + visibleRowHeights.get(top) * 0.5;
    const maxMoveY =
      columnHeaderHeight +
      visibleRowYs.get(bottomVisible) +
      visibleRowHeights.get(bottomVisible) * 0.5;
    if (mouseY < minMoveY && top > 0) {
      grid.setState({ top: top - 1 });
    } else if (mouseY > maxMoveY && top < lastTop) {
      grid.setState({ top: top + 1 });
    }

    return true;
  }

  onUp(_, grid) {
    if (this.draggingOffset != null) {
      this.draggingOffset = null;
      grid.setState({
        draggingRowOffset: null,
        draggingRow: null,
        isDragging: false,
      });
      return true;
    }

    return false;
  }
}

export default GridRowMoveMouseHandler;
