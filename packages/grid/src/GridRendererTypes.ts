import { type VisibleIndex, type Coordinate } from './GridMetrics';
import type GridMetrics from './GridMetrics';
import type GridModel from './GridModel';
import type GridRange from './GridRange';
import { type GridTheme } from './GridTheme';
import { type DraggingColumn } from './mouse-handlers/GridColumnMoveMouseHandler';
import { type GridSeparator } from './mouse-handlers/GridSeparatorMouseHandler';

// Default font width in pixels if it cannot be retrieved from the context
export const DEFAULT_FONT_WIDTH = 10;

export type EditingCellTextSelectionRange = [start: number, end: number];

export type EditingCell = {
  // Index of the editing cell
  column: VisibleIndex;
  row: VisibleIndex;

  // Selection within the text
  selectionRange?: EditingCellTextSelectionRange;

  // The value to use for the edit
  value: string;

  // Whether the selection was triggered with a quick edit action (e.g. Start typing with the cell in focus)
  isQuickEdit?: boolean;
};

export type GridRenderState = {
  // Width and height of the total canvas area
  width: number;
  height: number;

  // The canvas context
  context: CanvasRenderingContext2D;

  // The grid theme
  theme: GridTheme;

  // The model used by the grid
  model: GridModel;

  // The grid metrics
  metrics: GridMetrics;

  // Location of the mouse on the grid
  mouseX: Coordinate | null;
  mouseY: Coordinate | null;

  // Where the keyboard cursor is located
  cursorColumn: VisibleIndex | null;
  cursorRow: VisibleIndex | null;

  // Currently selected ranges
  selectedRanges: readonly GridRange[];

  // Currently dragged column/row information
  draggingColumn: DraggingColumn | null;
  draggingColumnSeparator: GridSeparator | null;
  draggingRow: VisibleIndex | null;
  draggingRowOffset: number | null;
  draggingRowSeparator: GridSeparator | null;

  // The currently editing cell
  editingCell: EditingCell | null;
  isDraggingHorizontalScrollBar: boolean;
  isDraggingVerticalScrollBar: boolean;
  isDragging: boolean;
};
