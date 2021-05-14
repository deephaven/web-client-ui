/* eslint class-methods-use-this: "off" */
import { GridMouseHandler } from '@deephaven/grid';

/**
 * Handles interaction with tables when the Linker tool is active
 */
class IrisGridColumnSelectMouseHandler extends GridMouseHandler {
  constructor(irisGrid) {
    super();

    this.irisGrid = irisGrid;
    this.cursor = null;
  }

  isActive() {
    const { isSelectingColumn } = this.irisGrid.props;
    return isSelectingColumn;
  }

  isValidColumn(tableColumn) {
    if (tableColumn == null) {
      return false;
    }

    const { columnSelectionValidator } = this.irisGrid.props;
    if (columnSelectionValidator) {
      return columnSelectionValidator(tableColumn);
    }
    return true;
  }

  updateColumnSelectionStatus() {
    const { columnSelectionValidator } = this.irisGrid.props;
    if (columnSelectionValidator) {
      columnSelectionValidator(null);
    }
  }

  getTableColumn(columnIndex) {
    if (columnIndex == null) {
      return null;
    }

    const { model } = this.irisGrid.props;
    const modelColumn = this.irisGrid.getModelColumn(columnIndex);
    if (modelColumn == null) {
      return null;
    }

    return model.columns[modelColumn];
  }

  onMove(gridPoint) {
    if (!this.isActive()) {
      return false;
    }

    const { columnAllowedCursor, columnNotAllowedCursor } = this.irisGrid.props;
    const { column } = gridPoint;
    const tableColumn = this.getTableColumn(column);

    if (this.isValidColumn(tableColumn)) {
      this.cursor = columnAllowedCursor;
      this.irisGrid.setState({ hoverSelectColumn: column });
    } else {
      this.cursor = columnNotAllowedCursor;
      this.irisGrid.setState({ hoverSelectColumn: null });
    }

    return true;
  }

  // keeps linker cursor state during wheel event
  onWheel(gridPoint) {
    if (!this.isActive()) {
      return false;
    }

    const { columnAllowedCursor, columnNotAllowedCursor } = this.irisGrid.props;
    const { column } = gridPoint;
    const tableColumn = this.getTableColumn(column);

    if (this.isValidColumn(tableColumn)) {
      this.cursor = columnAllowedCursor;
    } else {
      this.cursor = columnNotAllowedCursor;
    }

    // don't block wheel event from scrolling
    return { preventDefault: false, stopPropagation: false };
  }

  onLeave() {
    if (this.isActive()) {
      this.irisGrid.setState({ hoverSelectColumn: null });
    }

    this.updateColumnSelectionStatus();

    return false;
  }

  onDown() {
    return this.isActive();
  }

  onClick(gridPoint) {
    if (!this.isActive()) {
      return false;
    }

    const { column } = gridPoint;
    const tableColumn = this.getTableColumn(column);
    if (this.isValidColumn(tableColumn)) {
      this.irisGrid.selectColumn(tableColumn);
    }

    return true;
  }
}

export default IrisGridColumnSelectMouseHandler;
