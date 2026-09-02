/* eslint class-methods-use-this: "off" */
import clamp from 'lodash.clamp';
import { type EventHandlerResult } from '../EventHandlerResult';
import type Grid from '../Grid';
import GridRange from '../GridRange';
import type { GridRangeIndex } from '../GridRange';
import GridUtils from '../GridUtils';
import { gestureModeFromModifiers } from '../GridSelectionUtils';
import KeyHandler, { type GridKeyboardEvent } from '../KeyHandler';

class SelectionKeyHandler extends KeyHandler {
  onDown(event: GridKeyboardEvent, grid: Grid): EventHandlerResult {
    const isShiftKey = event.shiftKey;
    const isModifierKey = GridUtils.isModifierKeyDown(event);
    switch (event.key) {
      case 'a':
        if (isModifierKey) {
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
      /**
       * h/j/k/l keys are grouped together for quick navigation by power users.
       * Bender added these as shortcuts in the original commit of keyboard shortcuts.
       * We have no idea why, or what might have inspired them (not excel, not swing, vim?).
       * Maybe lack of page up keys on a laptop at the time?
       */
      case 'k':
      case 'K':
        if (isModifierKey) return false;
        return this.handlePageUp(event, grid);
      case 'j':
      case 'J':
        if (isModifierKey) return false;
        return this.handlePageDown(event, grid);
      case 'h':
      case 'H':
        if (isModifierKey) return false;
        // In row-selection mode, column-edge movement is meaningless.
        if (grid.props.theme.autoSelectRow === true) return true;
        return this.handleRowEdge(0, event, grid);
      case 'l':
      case 'L':
        if (isModifierKey) return false;
        if (grid.props.theme.autoSelectRow === true) return true;
        return this.handleRowEdge(
          grid.props.model.columnCount - 1,
          event,
          grid
        );
      case 'PageDown':
        return this.handlePageDown(event, grid);
      case 'PageUp':
        return this.handlePageUp(event, grid);
      case 'Home':
      case 'End': {
        const { model } = grid.props;
        const { columnCount, rowCount } = model;
        const { cursorColumn, cursorRow } = grid.state;
        const toEnd = event.key === 'End';
        // In row-selection mode, plain / Shift Home/End would only move the
        // cursor between columns and (via commit) toggle the row selection.
        // Ctrl+Home/End still jumps to top/bottom row, which is meaningful.
        if (grid.props.theme.autoSelectRow === true && !isModifierKey) {
          return true;
        }
        // Ctrl/Meta pins the column and jumps to the row edge; without it
        // Home/End jumps to the column edge on the current row.
        let targetColumn: GridRangeIndex;
        let targetRow: GridRangeIndex;
        if (isModifierKey) {
          targetColumn = cursorColumn;
          targetRow = toEnd ? rowCount - 1 : 0;
        } else {
          targetColumn = toEnd ? columnCount - 1 : 0;
          targetRow = cursorRow;
        }
        if (targetColumn == null || targetRow == null) return false;
        // Shift extends via maximize (grow the last range's furthest edge)
        // to preserve pre-refactor Shift+Home followed by Shift+End behavior.
        grid.handleKeySelectAt(
          { column: targetColumn, row: targetRow },
          isShiftKey ? 'maximize' : 'replace'
        );
        return true;
      }
      case 'Escape':
        if (grid.state.selection.isEmpty()) return false;
        grid.clearSelectedRanges();
        // consume the event, and stop propagation only if there were selected ranges to clear
        return { preventDefault: false, stopPropagation: true };
      case 'Enter':
        if (!grid.state.selection.isEmpty()) {
          grid.handleKeyAdvanceCursor(
            isShiftKey
              ? GridRange.SELECTION_DIRECTION.UP
              : GridRange.SELECTION_DIRECTION.DOWN
          );
          return true;
        }
        break;
      case 'Tab':
        if (!grid.state.selection.isEmpty()) {
          grid.handleKeyAdvanceCursor(
            isShiftKey
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

    const { cursorRow, cursorColumn, selectionEndColumn, selectionEndRow } =
      grid.state;
    const column = isShiftKey ? selectionEndColumn : cursorColumn;
    const row = isShiftKey ? selectionEndRow : cursorRow;

    // Ctrl+Arrow is an exception to the mode returned by gestureModeFromModifiers
    // It jumps to the edge of the grid in the arrow direction, and replaces the selection.
    if (isModifierKey) {
      const { model } = grid.props;
      const { columnCount, rowCount } = model;
      let moveToColumn: number | null = null;
      let moveToRow: number | null = null;
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
        // Avoid deselection when the target cell is already selected in a single-row selection.
        if (
          !isShiftKey &&
          grid.state.selection.isSingleRowSelection() &&
          grid.state.selection.isCellSelected(moveToColumn, moveToRow)
        ) {
          grid.handleKeyMoveCursor(moveToColumn, moveToRow);
        } else {
          grid.handleKeySelectAt(
            { column: moveToColumn, row: moveToRow },
            isShiftKey ? 'maximize' : 'replace'
          );
        }
      }
      return true;
    }

    if (!grid.metrics) throw new Error('grid.metrics are not set');

    // Plain / Shift arrows: mode is derived from Shift alone here since `isModifierKey` was short-circuited above.
    const mode = gestureModeFromModifiers({ isShiftKey, isModifierKey: false });

    const { theme } = grid.props;
    const { autoSelectRow = false, autoSelectColumn = false } = theme;
    if (autoSelectRow && deltaColumn !== 0) {
      const { lastLeft } = grid.metrics;
      const left = clamp(grid.state.left + deltaColumn, 0, lastLeft);
      if (cursorRow != null) {
        grid.handleKeyMoveCursor(left, cursorRow);
      }
      grid.setViewState({ left });
      return true;
    }
    if (autoSelectColumn && deltaRow !== 0) {
      const { lastTop } = grid.metrics;
      const top = clamp(grid.state.top + deltaRow, 0, lastTop);
      // Preserves the (arguably surprising) original behavior of using `top`
      // as the column argument; kept identical to pre-refactor code paths.
      grid.handleKeySelectAt({ column: top, row: cursorColumn }, mode, {
        keepCursorInView: false,
      });
      grid.setViewState({ top });
      return true;
    }

    if (row === null || column === null) {
      const { left, top } = grid.state;
      grid.handleKeySelectAt({ column: left, row: top }, mode);
      return true;
    }
    const { model } = grid.props;
    const { columnCount, rowCount } = model;
    // Resolve `row` through the selection so `KeyedSelection` can compensate
    // for ticks that shuffle row indices under the stored cursor / endpoint.
    const resolvedRow = isShiftKey
      ? grid.state.selection.resolveShiftEndpointRow(row)
      : grid.state.selection.resolveCursorRow(row);
    const targetColumn = clamp(column + deltaColumn, 0, columnCount - 1);
    const targetRow = clamp((resolvedRow ?? row) + deltaRow, 0, rowCount - 1);
    // Avoid deselection when the target cell is already selected in a single-row selection.
    if (
      !isShiftKey &&
      grid.state.selection.isSingleRowSelection() &&
      grid.state.selection.isCellSelected(targetColumn, targetRow)
    ) {
      grid.handleKeyMoveCursor(targetColumn, targetRow);
      return true;
    }
    grid.handleKeySelectAt({ column: targetColumn, row: targetRow }, mode);
    return true;
  }

  handleRowEdge(
    targetColumn: number,
    event: GridKeyboardEvent,
    grid: Grid
  ): boolean {
    const isShiftKey = event.shiftKey;
    const { cursorRow } = grid.state;
    if (cursorRow == null) return false;
    grid.handleKeySelectAt(
      { column: targetColumn, row: cursorRow },
      gestureModeFromModifiers({ isShiftKey, isModifierKey: false })
    );
    return true;
  }

  handlePageUp(e: GridKeyboardEvent, grid: Grid): boolean {
    const mode = gestureModeFromModifiers({
      isShiftKey: e.shiftKey,
      isModifierKey: false,
    });
    grid.handleKeyPageUp(mode);
    return true;
  }

  handlePageDown(e: GridKeyboardEvent, grid: Grid): boolean {
    const mode = gestureModeFromModifiers({
      isShiftKey: e.shiftKey,
      isModifierKey: false,
    });
    grid.handleKeyPageDown(mode);
    return true;
  }
}

export default SelectionKeyHandler;
