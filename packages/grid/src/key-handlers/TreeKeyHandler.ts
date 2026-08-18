/* eslint class-methods-use-this: "off" */
import { isExpandableGridModel } from '../ExpandableGridModel';
import type Grid from '../Grid';
import type GridRange from '../GridRange';
import { isRangedSelection } from '../RangedSelection';
import KeyHandler from '../KeyHandler';

class TreeKeyHandler extends KeyHandler {
  onDown(event: KeyboardEvent, grid: Grid): boolean {
    switch (event.key) {
      case 'Enter':
      case ' ': {
        return this.handleExpandKey(event, grid);
      }
      default:
        break;
    }
    return false;
  }

  handleExpandKey(event: KeyboardEvent, grid: Grid): boolean {
    // Keyed tables have no expandable rows; ignore the shortcut rather than throwing.
    if (!isRangedSelection(grid.state.selection)) return false;
    const ranges = grid.state.selection.toRanges();
    if (ranges.length === 1) {
      const range = ranges[0] as GridRange;
      if (
        range.startRow === range.endRow &&
        range.startColumn === range.endColumn
      ) {
        if (!grid.metrics) throw new Error('grid.metrics not set');

        const { model } = grid.props;
        const { startRow: row, startColumn: column } = range;
        if (row != null) {
          const modelRow = grid.getModelRow(row);
          if (
            (column === 0 || column == null) &&
            isExpandableGridModel(model) &&
            model.isRowExpandable(modelRow)
          ) {
            grid.toggleRowExpanded(row);
            return true;
          }
        }
      }
    }
    return false;
  }
}

export default TreeKeyHandler;
