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

// TODO #620
/** Represents a move operation from one index to another */
export type MoveOperation = {
  from: VisibleIndex;
  to: VisibleIndex;
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
  visibleRows: VisibleIndex[];
  visibleColumns: VisibleIndex[];

  // Array of floating rows/columns, by grid index
  floatingRows: VisibleIndex[];
  floatingColumns: VisibleIndex[];

  // Array of all rows/columns, visible and floating, by grid index
  allRows: VisibleIndex[];
  allColumns: VisibleIndex[];

  // Map of the height/width of visible rows/columns
  visibleRowHeights: SizeMap;
  visibleColumnWidths: SizeMap;

  // Floating metrics
  floatingTopHeight: number;
  floatingBottomHeight: number;
  floatingLeftWidth: number;
  floatingRightWidth: number;

  // Map of the X/Y coordinates of the rows/columns, from the top left of the grid
  visibleRowYs: CoordinateMap;
  visibleColumnXs: CoordinateMap;

  // The boxes user can click on for expanding/collapsing tree rows
  visibleRowTreeBoxes: Map<VisibleIndex, BoxCoordinates>;

  // Mapping from visible row indexes to the model row/columns they pull from
  modelRows: VisibleToModelMap;
  modelColumns: VisibleToModelMap;

  movedRows: MoveOperation[];
  movedColumns: MoveOperation[];

  // Map of the width of the fonts
  fontWidths: Map<string, number>;

  // Map of user set column/row width/height
  userColumnWidths: ModelSizeMap;
  userRowHeights: ModelSizeMap;

  // Map of calculated row/column height/width
  calculatedRowHeights: ModelSizeMap;
  calculatedColumnWidths: ModelSizeMap;

  columnHeaderMaxDepth: number;
};

export default GridMetrics;
