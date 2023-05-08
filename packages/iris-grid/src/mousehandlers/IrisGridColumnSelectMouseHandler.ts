/* eslint class-methods-use-this: "off" */
import {
  GridMouseHandler,
  GridPoint,
  EventHandlerResult,
} from '@deephaven/grid';
import type { Column } from '@deephaven/jsapi-types';
import { IrisGrid } from '../IrisGrid';

/**
 * Handles interaction with tables when the Linker tool is active
 */
class IrisGridColumnSelectMouseHandler extends GridMouseHandler {
  constructor(irisGrid: IrisGrid) {
    super();

    this.irisGrid = irisGrid;
    this.cursor = null;
  }

  private irisGrid: IrisGrid;

  private isActive(): boolean {
    const { isSelectingColumn } = this.irisGrid.props;
    return isSelectingColumn;
  }

  private isValidColumn(tableColumn: Column | null): boolean {
    if (tableColumn == null) {
      return false;
    }

    const { columnSelectionValidator } = this.irisGrid.props;
    if (columnSelectionValidator != null) {
      return columnSelectionValidator(tableColumn);
    }
    return true;
  }

  private updateColumnSelectionStatus(): void {
    const { columnSelectionValidator } = this.irisGrid.props;
    if (columnSelectionValidator != null) {
      columnSelectionValidator(null);
    }
  }

  private getTableColumn(columnIndex: number | null): Column | null {
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

  onMove(gridPoint: GridPoint): EventHandlerResult {
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
  onWheel(gridPoint: GridPoint): EventHandlerResult {
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

    // don't block wheel event from scrolling
    return { preventDefault: false, stopPropagation: false };
  }

  onLeave(): EventHandlerResult {
    if (this.isActive()) {
      this.irisGrid.setState({ hoverSelectColumn: null });
    }

    this.updateColumnSelectionStatus();

    return false;
  }

  onDown(): EventHandlerResult {
    return this.isActive();
  }

  onClick(gridPoint: GridPoint): EventHandlerResult {
    if (!this.isActive()) {
      return false;
    }

    const { column } = gridPoint;
    const tableColumn = this.getTableColumn(column);
    if (tableColumn != null && this.isValidColumn(tableColumn)) {
      this.irisGrid.selectColumn(tableColumn);
    }

    return true;
  }
}

export default IrisGridColumnSelectMouseHandler;
