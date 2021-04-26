/* eslint class-methods-use-this: "off" */
import Grid from '../Grid';
import GridRange from '../GridRange';
import KeyHandler from '../KeyHandler';

class TreeKeyHandler extends KeyHandler {
  onDown(e: KeyboardEvent, grid: Grid): boolean {
    switch (e.key) {
      case 'Enter':
      case ' ': {
        return this.handleExpandKey(e, grid);
      }
      default:
        break;
    }
    return false;
  }

  handleExpandKey(e: KeyboardEvent, grid: Grid): boolean {
    const { selectedRanges } = grid.state;
    if (selectedRanges.length === 1) {
      const range = selectedRanges[0] as GridRange;
      if (
        range.startRow === range.endRow &&
        range.startColumn === range.endColumn
      ) {
        const { model } = grid.props;
        const { modelRows } = grid.metrics;
        const { startRow: row, startColumn: column } = selectedRanges[0];
        const modelRow = modelRows.get(row);
        if (
          (column === 0 || column == null) &&
          model.isRowExpandable(modelRow)
        ) {
          grid.toggleRowExpanded(row);
          return true;
        }
      }
    }
    return false;
  }
}

export default TreeKeyHandler;
