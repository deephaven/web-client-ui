/* eslint class-methods-use-this: "off" */
import clamp from 'lodash.clamp';
import Grid from '../Grid';
import GridRange from '../GridRange';
import GridUtils from '../GridUtils';
import KeyHandler, { GridKeyboardEvent } from '../KeyHandler';

class SelectionKeyHandler extends KeyHandler {
  onDown(event: GridKeyboardEvent, grid: Grid): boolean {
    switch (event.key) {
      case 'a':
        if (GridUtils.isModifierKeyDown(event)) {
          grid.selectAll();
          return true;
        }
        break;
      case 'ArrowUp':
        return this.handleArrowMove(0, -1, event, grid);
      case 'ArrowDown':
        return this.handleArrowMove(0, 1, event, grid);
      case 'ArrowRight':
        return this.handleArrowMove(1, 0, event, grid);
      case 'ArrowLeft':
        return this.handleArrowMove(-1, 0, event, grid);
      case 'k': // h/j/k/l keys are grouped together for quick navigation by power users
      case 'PageUp':
        return this.handlePageUp(event, grid);
      case 'j':
      case 'PageDown':
        return this.handlePageDown(event, grid);
      case 'h':
        grid.clearSelectedRanges();
        grid.moveCursorToPosition(0, grid.state.cursorRow);
        return true;
      case 'l': {
        const { model } = grid.props;
        const { columnCount } = model;
        grid.clearSelectedRanges();
        grid.moveCursorToPosition(columnCount - 1, grid.state.cursorRow);
        return true;
      }
      case 'Home':
        if (!event.shiftKey) {
          grid.clearSelectedRanges();
        }
        grid.moveCursorToPosition(
          GridUtils.isModifierKeyDown(event) ? grid.state.cursorColumn : 0,
          GridUtils.isModifierKeyDown(event) ? 0 : grid.state.cursorRow,
          event.shiftKey,
          true,
          true
        );
        return true;
      case 'End': {
        const { model } = grid.props;
        const { columnCount, rowCount } = model;
        if (!event.shiftKey) {
          grid.clearSelectedRanges();
        }
        grid.moveCursorToPosition(
          GridUtils.isModifierKeyDown(event)
            ? grid.state.cursorColumn
            : columnCount - 1,
          GridUtils.isModifierKeyDown(event)
            ? rowCount - 1
            : grid.state.cursorRow,
          event.shiftKey,
          true,
          true
        );
        return true;
      }
      case 'Escape':
        grid.clearSelectedRanges();
        return true;
      case 'Enter':
        if (grid.state.selectedRanges.length > 0) {
          grid.moveCursorInDirection(
            event.shiftKey
              ? GridRange.SELECTION_DIRECTION.UP
              : GridRange.SELECTION_DIRECTION.DOWN
          );
          return true;
        }
        break;
      case 'Tab':
        if (grid.state.selectedRanges.length > 0) {
          grid.moveCursorInDirection(
            event.shiftKey
              ? GridRange.SELECTION_DIRECTION.LEFT
              : GridRange.SELECTION_DIRECTION.RIGHT
          );
          return true;
        }
        break;
      default:
        break;
    }
    return false;
  }

  handleArrowMove(
    deltaColumn: number,
    deltaRow: number,
    event: GridKeyboardEvent,
    grid: Grid
  ): boolean {
    const isShiftKey = event.shiftKey;
    const isModifierKey = GridUtils.isModifierKeyDown(event);
    if (isShiftKey) {
      grid.trimSelectedRanges();
    } else {
      grid.clearSelectedRanges();
    }

    const {
      cursorRow,
      cursorColumn,
      selectionEndColumn,
      selectionEndRow,
    } = grid.state;
    const column = isShiftKey ? selectionEndColumn : cursorColumn;
    const row = isShiftKey ? selectionEndRow : cursorRow;
    if (isModifierKey) {
      const { model } = grid.props;
      const { columnCount, rowCount } = model;
      const maximizePreviousRange = isModifierKey && isShiftKey;
      let moveToColumn = null;
      let moveToRow = null;
      if (deltaColumn < 0) {
        moveToColumn = 0;
        moveToRow = row;
      } else if (deltaColumn > 0) {
        moveToColumn = columnCount - 1;
        moveToRow = row;
      } else if (deltaRow < 0) {
        moveToColumn = column;
        moveToRow = 0;
      } else if (deltaRow > 0) {
        moveToColumn = column;
        moveToRow = rowCount - 1;
      }
      if (moveToColumn != null && moveToRow != null) {
        grid.moveCursorToPosition(
          moveToColumn,
          moveToRow,
          isShiftKey,
          true,
          maximizePreviousRange
        );
      }
    } else {
      if (!grid.metrics) throw new Error('grid.metrics are not set');

      const { theme } = grid.props;
      const { autoSelectRow, autoSelectColumn } = theme;
      if (autoSelectRow && deltaColumn !== 0) {
        const { lastLeft } = grid.metrics;
        let { left } = grid.state;

        left = clamp(left + deltaColumn, 0, lastLeft);

        grid.moveCursorToPosition(left, cursorRow, isShiftKey, false);

        grid.setViewState({ left });
      } else if (autoSelectColumn && deltaRow !== 0) {
        const { lastTop } = grid.metrics;
        let { top } = grid.state;

        top = clamp(top + deltaRow, 0, lastTop);

        grid.moveCursorToPosition(top, cursorColumn, isShiftKey, false);

        grid.setViewState({ top });
      } else {
        grid.moveCursor(deltaColumn, deltaRow, isShiftKey);
      }
    }
    return true;
  }

  handlePageUp(e: GridKeyboardEvent, grid: Grid): boolean {
    const isShiftKey = e.shiftKey;

    if (isShiftKey) {
      grid.trimSelectedRanges();
    } else {
      grid.clearSelectedRanges();
    }

    const { cursorColumn, selectionEndRow } = grid.state;
    const row: number | null = selectionEndRow;
    const column: number | null = cursorColumn;
    if (row == null) {
      return false;
    }
    const metricState = grid.getMetricState();
    const { metricCalculator } = grid;
    const {
      bottomVisible,
      topVisible,
      hasHorizontalBar,
    } = metricCalculator.getMetrics(metricState);

    let selectRangeEndPosition = row - (bottomVisible - topVisible);
    selectRangeEndPosition -= hasHorizontalBar ? 0 : 1;

    // Don't move beyond the top table row.
    selectRangeEndPosition = Math.max(selectRangeEndPosition, 0);
    const viewportPosition = Math.max(
      selectRangeEndPosition - (row - topVisible),
      0
    );

    grid.moveCursorToPosition(
      column,
      selectRangeEndPosition,
      isShiftKey,
      false
    );
    grid.setViewState({ top: viewportPosition });
    return true;
  }

  handlePageDown(e: GridKeyboardEvent, grid: Grid): boolean {
    const isShiftKey = e.shiftKey;

    if (isShiftKey) {
      grid.trimSelectedRanges();
    } else {
      grid.clearSelectedRanges();
    }

    const { selectionEndRow, cursorColumn } = grid.state;
    const row: number | null = selectionEndRow;
    const column: number | null = cursorColumn;
    if (row === null) {
      return false;
    }
    const metricState = grid.getMetricState();
    const { metricCalculator } = grid;
    const {
      bottomVisible,
      topVisible,
      hasHorizontalBar,
      rowCount,
      lastTop,
    } = metricCalculator.getMetrics(metricState);
    const lastRowIndex = rowCount - 1;

    let selectRangeEndPosition = bottomVisible - topVisible + row;
    selectRangeEndPosition += hasHorizontalBar ? 0 : 1;

    // Don't move beyond the bottom table row.
    selectRangeEndPosition = Math.min(selectRangeEndPosition, lastRowIndex);

    const viewportPosition = Math.min(
      lastTop,
      selectRangeEndPosition - (row - topVisible)
    );
    grid.moveCursorToPosition(
      column,
      selectRangeEndPosition,
      isShiftKey,
      false
    );
    grid.setViewState({ top: viewportPosition });

    return true;
  }
}

export default SelectionKeyHandler;
