import type React from 'react';
import { type VisibleIndex, type Coordinate } from './GridMetrics';
import type GridMetrics from './GridMetrics';
import type GridModel from './GridModel';
import type GridRange from './GridRange';
import { type GridTheme } from './GridTheme';
import { type DraggingColumn } from './mouse-handlers/GridColumnMoveMouseHandler';
import { type GridSeparator } from './mouse-handlers/GridSeparatorMouseHandler';
import type { CellInputFieldProps } from './CellInputField';
import type { ColumnRestriction } from './GridModel';

// Default font width in pixels if it cannot be retrieved from the context
export const DEFAULT_FONT_WIDTH = 10;

/**
 * Props passed to a cell input renderer, combining the base CellInputField
 * props with the restrictions that apply to the cell being edited.
 */
export type CellInputProps = CellInputFieldProps & {
  restrictions: readonly ColumnRestriction[];
};

/**
 * A renderer for a single cell input field based on column restriction type.
 *
 * Set `preservesExistingValue = true` on the function to signal that
 * keystroke-initiated edits should open the editor with the existing cell
 * value rather than replacing it with the typed character.
 */
export type CellInputRendererFn = ((
  props: CellInputProps
) => React.ReactNode) & {
  /**
   * When true, keystroke-initiated edits preserve the existing cell value
   * instead of replacing it with the typed character. Intended for renderers
   * like dropdowns where the typed character has no meaning as a new value.
   */
  preservesExistingValue?: boolean;
};

/**
 * A map from column restriction type string to a cell input renderer function.
 * Grid looks up restrictions[0].type in this registry and falls back to
 * CellInputField when there is no match.
 */
export type CellInputRendererRegistry = ReadonlyMap<
  string,
  CellInputRendererFn
>;

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
