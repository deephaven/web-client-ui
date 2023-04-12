import GridModel from './GridModel';
import GridRange from './GridRange';

export type CellRendererType = 'text' | 'databar';

/** A grid coordinate value */
export type Coordinate = number;

/** Coordinates of a box */
export type BoxCoordinates = {
  x1: Coordinate;
  y1: Coordinate;
  x2: Coordinate;
  y2: Coordinate;
};

/** The visible index of the item, eg. after moves are applied */
export type VisibleIndex = number;

/** The model index of the item, eg. moves are not applied */
export type ModelIndex = number;

/** Map from an item index to it's coordinate */
export type CoordinateMap = Map<VisibleIndex, Coordinate>;

/** Map from an item index to it's size */
export type SizeMap = Map<VisibleIndex, number>;

/** Map from a ModelIndex to it's size */
export type ModelSizeMap = Map<ModelIndex, number>;

/** Map from visible Index to ModelIndex */
export type VisibleToModelMap = Map<VisibleIndex, ModelIndex>;

/** Represents a move operation from one index to another */
export type MoveOperation = {
  from: VisibleIndex | BoundedAxisRange;
  to: VisibleIndex;
};
export type Range<T> = [start: T, end: T];

export type AxisRange = Range<GridRangeIndex>;
export type BoundedAxisRange = Range<VisibleIndex>;

export type EditingCellTextSelectionRange = [start: number, end: number];

export type GridRangeIndex = number | null;
export type LeftIndex = GridRangeIndex;
export type RightIndex = GridRangeIndex;
export type TopIndex = GridRangeIndex;
export type BottomIndex = GridRangeIndex;

export type GridCell = { column: number; row: number };

// GridTheme

/** A color parsed as CSS color value, eg. '#FF0000' */
export type GridColor = string;

/** A nullable color, eg. pass `null` to skip drawing this item */
export type NullableGridColor = GridColor | null;

/** One or more colors parsed as CSS color value separated by space, eg. '#FF0000 #00FF00' */
export type GridColorWay = string;

/** A font parsed as CSS font value */
export type GridFont = string;

export type GridTheme = {
  // Allow column/row resizing
  allowColumnResize: boolean;
  allowRowResize: boolean;

  // Select the full row/column upon selection
  autoSelectRow: boolean;
  autoSelectColumn: boolean;

  // Automatically size rows/columns to fit contents
  autoSizeColumns: boolean;
  autoSizeRows: boolean;

  // The background color for the whole grid
  backgroundColor: GridColor;

  // Color to draw text
  textColor: GridColor;
  hyperlinkColor: GridColor;

  // Black and white to use if needed
  black: GridColor;
  white: GridColor;

  // Amount of padding within a cell and header
  cellHorizontalPadding: number;
  headerHorizontalPadding: number;

  // The font to use in the grid
  font: GridFont;

  // Colors to draw grid lines between columns and rows
  gridColumnColor: NullableGridColor;
  gridRowColor: NullableGridColor;

  // Colors for drawing the column and row headers
  headerBackgroundColor: GridColor;
  headerSeparatorColor: GridColor;
  headerSeparatorHoverColor: GridColor;
  headerSeparatorHandleSize: number;
  headerHiddenSeparatorSize: number;
  headerHiddenSeparatorHoverColor: GridColor;
  headerColor: GridColor;
  headerFont: GridFont;

  // Background color to highlight entire column/row if set
  columnHoverBackgroundColor: NullableGridColor;
  selectedColumnHoverBackgroundColor: NullableGridColor;
  rowHoverBackgroundColor: NullableGridColor;
  selectedRowHoverBackgroundColor: NullableGridColor;

  // Background colors to draw for each row, cycling through each value (eg. alternating stripes)
  rowBackgroundColors: GridColorWay;

  // Scroll bar look and sizing
  minScrollHandleSize: number;
  scrollBarBackgroundColor: GridColor;
  scrollBarHoverBackgroundColor: GridColor;
  scrollBarCasingColor: GridColor;
  scrollBarCornerColor: GridColor;
  scrollBarColor: GridColor;
  scrollBarHoverColor: GridColor;
  scrollBarActiveColor: GridColor;
  scrollBarSize: number;
  scrollBarHoverSize: number;
  scrollBarCasingWidth: number;
  scrollSnapToColumn: boolean;
  scrollSnapToRow: boolean;

  scrollBarSelectionTick: boolean;
  scrollBarSelectionTickColor: NullableGridColor;
  scrollBarActiveSelectionTickColor: NullableGridColor;

  // Look of the current selection
  selectionColor: GridColor;
  selectionOutlineColor: GridColor;
  selectionOutlineCasingColor: GridColor;

  // Shadows to draw when representing a hierarchy, eg. when one row is a higher "depth" than the row above it
  shadowBlur: number;
  shadowColor: GridColor;
  maxDepth: number; // max depth of the shadowing

  // Other tree table metrics
  treeDepthIndent: number;
  treeHorizontalPadding: number;
  treeLineColor: GridColor;
  treeMarkerColor: GridColor;
  treeMarkerHoverColor: GridColor;

  // Default row height/column width
  rowHeight: number;
  columnWidth: number;
  minRowHeight: number;
  minColumnWidth: number;

  // Default row/column header/footers width/height
  columnHeaderHeight: number;
  rowHeaderWidth: number;
  rowFooterWidth: number;

  // When resizing the header, will snap to the auto size of the header within this threshold
  headerResizeSnapThreshold: number;
  headerResizeHiddenSnapThreshold: number;

  // Allow moving/reordering columns/rows
  allowColumnReorder: boolean;
  allowRowReorder: boolean;

  // The number of pixels to offset a column/row while it is being dragged to move
  reorderOffset: number;

  // Colors for the grid in floating sections
  floatingGridColumnColor: NullableGridColor;
  floatingGridRowColor: NullableGridColor;

  // Background row colors for grid in the floating sections
  floatingRowBackgroundColors: GridColorWay;

  // Divider colors between the floating parts and the grid
  floatingDividerOuterColor: GridColor;
  floatingDividerInnerColor: GridColor;
};

export type GridMetrics = {
  // Row/Column metrics from model
  rowHeight: number;
  rowHeaderWidth: number;
  rowFooterWidth: number;
  rowCount: number;
  columnWidth: number;
  columnCount: number;
  columnHeaderHeight: number;

  // Floating row and column counts
  floatingTopRowCount: number;
  floatingBottomRowCount: number;
  floatingLeftColumnCount: number;
  floatingRightColumnCount: number;

  // The grid offset from the top left
  gridX: Coordinate;
  gridY: Coordinate;

  // Index of non-hidden row/columns
  firstRow: VisibleIndex;
  firstColumn: VisibleIndex;

  // The amount of padding for tree (if applicable)
  treePaddingX: number;
  treePaddingY: number;

  // What viewport is currently visible, limited by data size
  left: VisibleIndex;
  top: VisibleIndex;
  bottom: VisibleIndex;
  right: VisibleIndex;
  topOffset: Coordinate;
  leftOffset: Coordinate;

  // Bottom and right that are fully visible, not overlapped by scroll bars or anything
  topVisible: VisibleIndex;
  leftVisible: VisibleIndex;
  bottomVisible: VisibleIndex;
  rightVisible: VisibleIndex;

  // Bottom and right of the viewport, not limited by data size
  bottomViewport: VisibleIndex;
  rightViewport: VisibleIndex;

  // Canvas width/height
  width: number;
  height: number;

  // Max x/y coordinate of the grid (does not include headers)
  maxX: Coordinate;
  maxY: Coordinate;

  // Last valid column/row that can be the left/top of the grid
  lastLeft: VisibleIndex;
  lastTop: VisibleIndex;

  // Scroll bar metrics
  barHeight: number;
  barTop: number; // Relative to canvas dimensions
  barWidth: number;
  barLeft: number; // Relative to canvas dimensions
  handleHeight: number;
  handleWidth: number;
  hasHorizontalBar: boolean;
  hasVerticalBar: boolean;
  verticalBarWidth: number;
  horizontalBarHeight: number;

  // The vertical x/y scroll amount
  scrollX: number;
  scrollY: number;

  // The size of all known content in the scrollable area
  scrollableContentWidth: number;
  scrollableContentHeight: number;

  // The visible space for scrollable content to display
  scrollableViewportWidth: number;
  scrollableViewportHeight: number;

  // Array of visible rows/columns, by grid index
  visibleRows: readonly VisibleIndex[];
  visibleColumns: readonly VisibleIndex[];

  // Map of the height/width of visible rows/columns
  visibleRowHeights: SizeMap;
  visibleColumnWidths: SizeMap;

  // Array of floating rows/columns, by grid index
  floatingRows: readonly VisibleIndex[];
  floatingColumns: readonly VisibleIndex[];

  // Array of all rows/columns, visible and floating, by grid index
  allRows: readonly VisibleIndex[];
  allColumns: readonly VisibleIndex[];

  // Map of the height/width of all rows/columns, visible and floating
  allRowHeights: SizeMap;
  allColumnWidths: SizeMap;

  // Floating metrics
  floatingTopHeight: number;
  floatingBottomHeight: number;
  floatingLeftWidth: number;
  floatingRightWidth: number;

  // Map of the X/Y coordinates of the visible rows/columns, from the top left of the grid
  visibleRowYs: CoordinateMap;
  visibleColumnXs: CoordinateMap;

  // Map of the X/Y coordinates of all rows/columns, visible and floating, from the top left of the grid
  allRowYs: CoordinateMap;
  allColumnXs: CoordinateMap;

  // The boxes user can click on for expanding/collapsing tree rows
  visibleRowTreeBoxes: Map<VisibleIndex, BoxCoordinates>;

  // Mapping from visible row indexes to the model row/columns they pull from
  modelRows: VisibleToModelMap;
  modelColumns: VisibleToModelMap;

  movedRows: readonly MoveOperation[];
  movedColumns: readonly MoveOperation[];

  // Map of the width of the fonts
  fontWidths: Map<string, number>;

  // Map of user set column/row width/height
  userColumnWidths: ModelSizeMap;
  userRowHeights: ModelSizeMap;

  // Map of calculated row/column height/width
  calculatedRowHeights: ModelSizeMap;
  calculatedColumnWidths: ModelSizeMap;

  // Max depth of column headers. Depth of 1 for a table without column groups
  columnHeaderMaxDepth: number;
};

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

/**
 * Edit operation when applying multiple edits
 */
export type EditOperation = {
  /** Column to set the value for */
  column: ModelIndex;

  /** Row to set the value for */
  row: ModelIndex;

  /** Text value to set */
  text: string;

  /** @deprecated use `column` instead */
  x?: ModelIndex;
  /** @deprecated use `row` instead */
  y?: ModelIndex;
};

// Event handler types

/**
 * Some events we listen to are a native mouse event, and others are wrapped with React's SyntheticEvent.
 * The GridMouseHandler shouldn't care though - the properties it accesses should be common on both types of events.
 */
export type GridMouseEvent = MouseEvent | React.MouseEvent;

export type GridWheelEvent = WheelEvent | React.WheelEvent;

/**
 * Some events we listen to are a native keyboard event, and others are wrapped with React's SyntheticEvent.
 * The KeyHandler shouldn't care though - the properties it accesses should be common on both types of events.
 */
export type GridKeyboardEvent = KeyboardEvent | React.KeyboardEvent;

export type GridMouseHandlerFunctionName =
  | 'onDown'
  | 'onMove'
  | 'onDrag'
  | 'onLeave'
  | 'onClick'
  | 'onContextMenu'
  | 'onDoubleClick'
  | 'onUp'
  | 'onWheel';

export interface DraggingColumn {
  range: BoundedAxisRange;
  depth: number;
  left: Coordinate;
  width: number;
}

// The different properties that can be used by implementing classes, whether for rows or columns
export type PointProperty = 'x' | 'y';
export type UserSizeProperty = 'userRowHeights' | 'userColumnWidths';
export type VisibleOffsetProperty = 'visibleRowYs' | 'visibleColumnXs';
export type VisibleSizeProperty = 'visibleRowHeights' | 'visibleColumnWidths';
export type MarginProperty = 'columnHeaderHeight' | 'rowHeaderWidth';
export type CalculatedSizeProperty =
  | 'calculatedRowHeights'
  | 'calculatedColumnWidths';
export type InitialSizeProperty = 'initialRowHeights' | 'initialColumnWidths';
export type ModelIndexesProperty = 'modelRows' | 'modelColumns';
export type FirstIndexProperty = 'firstRow' | 'firstColumn';
export type TreePaddingProperty = 'treePaddingX' | 'treePaddingY';
export interface GridSeparator {
  index: VisibleIndex;
  depth: number;
}

export type GridPoint = {
  x: Coordinate;
  y: Coordinate;
  column: GridRangeIndex;
  row: GridRangeIndex;
  columnHeaderDepth?: number;
};

export interface CellInfo {
  row: VisibleIndex | null;
  column: VisibleIndex | null;
  modelRow: ModelIndex | null;
  modelColumn: ModelIndex | null;
  left: Coordinate | null;
  top: Coordinate | null;
  columnWidth: number | null;
  rowHeight: number | null;
}

export type Token = {
  value: string;
  type: string;
  start: number;
  end: number;
  isLink?: boolean;
};
export type LinkToken = Token & { href: string };
export type URLToken = Token & { type: 'url' };
export type EmailToken = Token & { type: 'email' };

export function isLinkToken(token: Token): token is LinkToken {
  return (token as LinkToken)?.href !== undefined;
}

export type TokenBox = BoxCoordinates & { token: Token };

export type IndexCallback<T> = (itemIndex: VisibleIndex) => T | undefined;
